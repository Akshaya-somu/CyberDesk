import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import {
  setupAuth,
  registerAuthRoutes,
  isAuthenticated,
} from "./integrations/auth";
import { registerChatRoutes } from "./integrations/chat";
import { getResponseGuidance } from "./incident_response";
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    })
  : null;

/**
 * Incident Response logic for different categories of cybercrime.
 * This is kept simple and readable for easy explanation.
 */
const INCIDENT_RESPONSE_STEPS: Record<string, any> = {
  phishing: {
    immediate: [
      "Disconnect from the internet",
      "Do not click any more links",
      "Close all browser tabs",
    ],
    security: [
      "Change passwords for affected accounts",
      "Enable Two-Factor Authentication (2FA)",
    ],
    evidence: [
      "Take screenshots of the phishing email/SMS",
      "Copy the URL of the malicious site",
    ],
    nextSteps: [
      "Report to the service provider (e.g., your bank)",
      "Report on official cyber crime portal",
    ],
  },
  financial_fraud: {
    immediate: [
      "Call your bank to freeze your account/cards",
      "Block the UPI ID or mobile number used",
      "Check recent transactions",
    ],
    security: [
      "Reset your mobile banking PIN/Password",
      "Update your bank's contact details if changed",
    ],
    evidence: [
      "Save transaction IDs/UTR numbers",
      "Keep screenshots of payment confirmations",
    ],
    nextSteps: [
      "File a complaint with the bank's fraud department",
      "Report at cybercrime.gov.in",
    ],
  },
  account_hacking: {
    immediate: [
      "Log out from all other devices",
      "Check if recovery email/phone has been changed",
    ],
    security: [
      "Perform a password reset",
      "Revoke access to suspicious third-party apps",
      "Set up 2FA",
    ],
    evidence: [
      "Screenshot login attempt notifications",
      "Record the hacker's activity if visible",
    ],
    nextSteps: [
      "Contact the platform support (e.g., Instagram/Facebook)",
      "Inform your contacts about the hack",
    ],
  },
  identity_theft: {
    immediate: [
      "Check for unauthorized account openings",
      "Alert your primary bank and creditors",
    ],
    security: [
      "Place a fraud alert on your credit report",
      "Change passwords for all major services",
    ],
    evidence: [
      "Gather all instances of impersonation or misuse",
      "Document any unauthorized correspondence",
    ],
    nextSteps: [
      "Contact local police to report identity misuse",
      "Monitor your financial statements closely",
    ],
  },
  default: {
    immediate: [
      "Stay calm and stop interacting with the threat",
      "Secure your device",
    ],
    security: ["Change major account passwords", "Check privacy settings"],
    evidence: ["Preserve all communication logs and screenshots"],
    nextSteps: [
      "Consult a cyber security professional",
      "Report to the local cyber cell",
    ],
  },
};

function buildFirPrompt(description: string): string {
  return `
You are a Cyber Security Analyst and Digital Forensics Investigator.
Your task is to transform the incident description into investigation-quality JSON using the exact schema already used by CyberDesk.

Important goals:
- Do not copy the user's paragraph verbatim into any field.
- Extract every possible fact from the description before marking anything unavailable.
- Infer reasonable values from context when the incident text clearly implies them.
- Keep the FIR draft formal, professional, and legally worded.
- Populate arrays whenever the description contains any relevant clue.
- Prefer concise, evidence-based inferences over generic placeholders.

Incident description:
"${description}"

Extraction rules:
1. Read the whole description as evidence, not as a narrative to repeat.
2. Identify the primary incident type and any secondary attack types.
3. Extract named entities, artifacts, assets, timestamps, channels, and indicators.
4. Infer likely victim, organization, affected assets, and severity from the text.
5. If a section can be summarized from context, summarize it instead of returning an empty value.
6. Use "Information not available at the time of reporting" only after making a best-effort inference.
7. Keep arrays short and relevant, but do not leave them empty if the text contains usable evidence.
8. Never include raw markdown fences or commentary outside JSON.

Report-writing rules:
- ExecutiveSummary should read like a short analyst summary.
- Classification should include primaryAttack, attackTypes, initialAttackVector, and severity.
- Entities should capture any explicit or inferred names, emails, phones, domains, URLs, IPs, file names, wallet/account numbers, dates, times, and assets.
- IncidentTimeline should be chronological and should reflect the likely sequence of events.
- TechnicalAnalysis should describe attack method, delivery mechanism, payload, persistence, encryption, privilege escalation, and lateral movement when relevant.
- IOCs should list only indicators that appear in or are strongly implied by the description.
- AssetsAffected should include both explicit assets and obvious affected systems/components implied by the incident.
- ImpactAssessment should explain business, financial, operational, confidentiality, integrity, and availability impact.
- EvidenceSummary should summarize preserved evidence such as emails, screenshots, logs, attachments, headers, notes, transaction records, or related artifacts.
- ImmediateActionsTaken should state any actions already mentioned or directly implied by the narrative.
- RecommendedNextSteps should be incident-specific and actionable, not generic boilerplate.
- Annexure should list collected evidence, affected assets, attachments, logs, and reference items.
- FIR draft should be a professional submission-ready complaint, rewritten in formal legal language, not a copied paragraph.
- Use line breaks and clear section headings inside the FIR draft.

Return ONLY a valid JSON object that exactly matches the existing CyberDesk report schema.
`;
}

const INFORMATION_NOT_AVAILABLE =
  "Information not available at the time of reporting";

function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
}

function titleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function uniqueStrings(values: Array<string | undefined | null>): string[] {
  return Array.from(
    new Set(values.map((value) => cleanText(value)).filter(Boolean)),
  );
}

function mergeTimelineEntries(
  current: Array<{ time?: string; event?: string }> = [],
  inferred: Array<{ time?: string; event?: string }> = [],
): Array<{ time?: string; event?: string }> {
  const merged: Array<{ time?: string; event?: string }> = [];
  const seen = new Set<string>();

  for (const entry of [...current, ...inferred]) {
    const event = cleanText(entry?.event);
    const time = cleanText(entry?.time);
    const key = `${time}::${event}`;
    if (!event || seen.has(key)) continue;
    seen.add(key);
    merged.push({ time: time || undefined, event });
  }

  return merged.slice(0, 6);
}

function isUnavailable(value: unknown): boolean {
  const text = cleanText(value);
  return (
    !text ||
    text.toLowerCase() === INFORMATION_NOT_AVAILABLE.toLowerCase() ||
    text.toLowerCase() === "information not available"
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function stripCodeFences(content: string): string {
  return content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function safeParseGeneratedReport(content: string): Record<string, any> {
  const stripped = stripCodeFences(content);

  try {
    return JSON.parse(stripped);
  } catch (error) {
    // fall through to additional parsing attempts
  }

  const firstBrace = stripped.indexOf("{");
  const lastBrace = stripped.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const candidate = stripped.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (error) {
      // fall through to the structured fallback object below
    }
  }

  return {
    incidentType: "other",
    description: stripped || INFORMATION_NOT_AVAILABLE,
    firDraft: stripped || INFORMATION_NOT_AVAILABLE,
    generatedReportText: stripped || INFORMATION_NOT_AVAILABLE,
  };
}

function extractSignals(text: string) {
  const emails = uniqueStrings(
    text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [],
  );
  const urls = uniqueStrings(text.match(/https?:\/\/[^\s<>"]+/gi) || []);
  const ipAddresses = uniqueStrings(
    text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || [],
  );
  const hashes = uniqueStrings(text.match(/\b[a-fA-F0-9]{32,64}\b/g) || []);
  const walletAddresses = uniqueStrings(
    text.match(
      /\b(?:0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[0-9a-z]{11,71})\b/gi,
    ) || [],
  );
  const fileNames = uniqueStrings(
    text.match(
      /\b[\w.-]+\.(?:exe|dll|scr|zip|rar|7z|js|vbs|ps1|docx?|xlsx?|pptx?|pdf|html?|iso|img|apk|jar|bat|cmd|lnk|csv|txt)\b/gi,
    ) || [],
  );
  const domains = uniqueStrings(
    (text.match(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b/gi) || []).filter(
      (domain) => !emails.some((email) => email.includes(domain)),
    ),
  );
  const phones = uniqueStrings(
    text.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) || [],
  ).filter(
    (value) =>
      value.replace(/\D/g, "").length >= 7 &&
      value.replace(/\D/g, "").length <= 16,
  );
  const amounts = uniqueStrings(
    text.match(/(?:₹|rs\.?|inr|usd|\$)\s?\d[\d,]*(?:\.\d{2})?/gi) || [],
  );
  const fileExtensions = uniqueStrings(
    fileNames.map((fileName) => fileName.split(".").pop() || ""),
  ).filter((ext) => ext && ext.length <= 8);
  const dates = uniqueStrings(
    text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g) || [],
  );
  const times = uniqueStrings(
    text.match(/\b\d{1,2}:\d{2}(?:\s?[AP]M)?\b/gi) || [],
  );

  return {
    emails,
    urls,
    ipAddresses,
    hashes,
    walletAddresses,
    fileNames,
    fileExtensions,
    domains,
    phones,
    amounts,
    dates,
    times,
  };
}

function inferSeverityFromSignals(
  category: string,
  text: string,
  signals: ReturnType<typeof extractSignals>,
): { label: string; score: number; rationale: string } {
  const lower = text.toLowerCase();
  let score = 58;

  if (
    lower.includes("ransomware") ||
    lower.includes("encrypted") ||
    lower.includes("data breach") ||
    lower.includes("stolen") ||
    lower.includes("unauthorized transaction") ||
    lower.includes("wallet") ||
    signals.hashes.length > 0 ||
    signals.walletAddresses.length > 0
  ) {
    score = 90;
  } else if (
    lower.includes("malware") ||
    lower.includes("phishing") ||
    lower.includes("fraud") ||
    lower.includes("credential") ||
    lower.includes("bank") ||
    signals.amounts.length > 0 ||
    signals.urls.length > 0 ||
    signals.emails.length > 0
  ) {
    score = 78;
  } else if (lower.includes("suspicious") || lower.includes("unusual")) {
    score = 62;
  }

  const label =
    score >= 88
      ? "Critical"
      : score >= 74
        ? "High"
        : score >= 58
          ? "Medium"
          : "Low";
  const rationale =
    category === "other"
      ? "Severity inferred from the presence of explicit indicators and the described potential impact."
      : `Severity inferred from the ${category.replace(/_/g, " ")} indicators, preserved artifacts, and the described business or financial impact.`;

  return { label, score, rationale };
}

function buildTimeline(
  category: string,
  text: string,
  signals: ReturnType<typeof extractSignals>,
): Array<{ time?: string; event?: string }> {
  const lower = text.toLowerCase();
  const timeline: Array<{ time?: string; event?: string }> = [];
  const inferredTime = signals.times[0] || signals.dates[0] || undefined;

  const add = (event: string) => {
    if (!timeline.some((entry) => entry.event === event)) {
      timeline.push({ time: inferredTime, event });
    }
  };

  const keywordMap: Array<[RegExp, string]> = [
    [
      /received (?:a )?(phishing )?email|received sms|received message/i,
      "Suspicious communication received",
    ],
    [/clicked|opened|visited/i, "Malicious link or content opened"],
    [
      /downloaded|saved attachment|attachment/i,
      "Attachment or file downloaded",
    ],
    [/installed|executed|ran|launched/i, "Payload or application executed"],
    [
      /credentials|password|otp|pin/i,
      "Credentials or verification details entered",
    ],
    [
      /encrypted|locked|ransom/i,
      "Malicious activity impacted files or systems",
    ],
    [
      /money|transaction|debit|credit|bank|upi/i,
      "Unauthorized payment or transaction noticed",
    ],
    [
      /reported|informed|contacted|escalated/i,
      "Incident reported to relevant authority or support team",
    ],
  ];

  for (const [pattern, event] of keywordMap) {
    if (pattern.test(lower)) add(event);
  }

  if (timeline.length === 0) {
    const categoryDefaults: Record<string, string[]> = {
      phishing: [
        "Suspicious email or message received",
        "User interacted with malicious link or attachment",
        "Credentials or sensitive data exposed",
        "Password reset or account protection initiated",
      ],
      financial_fraud: [
        "Fraudulent payment request or impersonation attempt received",
        "Transaction details or OTP request noticed",
        "Unauthorized transfer or debit identified",
        "Bank or support team notified",
      ],
      account_hacking: [
        "Unusual login or access attempt observed",
        "Account credentials changed or compromised",
        "Recovery options or access controls reviewed",
        "Incident escalated to the platform or IT team",
      ],
      identity_theft: [
        "Personal information or identity details misused",
        "Impersonation or unauthorized account activity observed",
        "Affected accounts reviewed and secured",
        "Authorities or service providers informed",
      ],
      ransomware: [
        "Initial malware delivery or attachment exposure",
        "Malicious payload executed on endpoint",
        "Files or network shares encrypted",
        "Workstation isolated and incident response initiated",
      ],
      default: [
        "Incident identified from user description",
        "Potentially malicious activity reviewed",
        "Response and containment actions initiated",
      ],
    };

    (categoryDefaults[category] || categoryDefaults.default).forEach(add);
  }

  return timeline.slice(0, 6);
}

function buildEvidenceSummary(
  category: string,
  text: string,
  signals: ReturnType<typeof extractSignals>,
): string[] {
  const evidence: string[] = [];
  const lower = text.toLowerCase();

  if (signals.urls.length > 0)
    evidence.push("Malicious URL(s) captured from the incident description");
  if (signals.domains.length > 0)
    evidence.push("Suspicious domain name(s) identified");
  if (signals.emails.length > 0)
    evidence.push("Email address(es) preserved for analysis");
  if (signals.phones.length > 0)
    evidence.push("Phone number(s) preserved for investigation");
  if (signals.fileNames.length > 0)
    evidence.push("Suspicious file attachment(s) identified");
  if (signals.ipAddresses.length > 0)
    evidence.push("IP address(es) recorded for correlation");
  if (signals.hashes.length > 0)
    evidence.push("File hash or checksum preserved");
  if (signals.amounts.length > 0)
    evidence.push("Transaction or loss-related amount(s) noted");

  if (lower.includes("screenshot"))
    evidence.push("Screenshots referenced in the report");
  if (lower.includes("header"))
    evidence.push("Email header information available or referenced");
  if (lower.includes("log"))
    evidence.push("System or application logs mentioned in the description");
  if (lower.includes("bank") || lower.includes("transaction"))
    evidence.push("Financial transaction details referenced");
  if (lower.includes("ransom"))
    evidence.push("Ransom note or ransom-related message preserved");
  if (lower.includes("otp"))
    evidence.push("OTP alert or authentication event referenced");

  const categoryEvidence: Record<string, string[]> = {
    phishing: [
      "Phishing email or message screenshot",
      "Original sender details",
      "Suspicious URL and landing page evidence",
    ],
    financial_fraud: [
      "Transaction confirmation or bank statement",
      "Fraud communication screenshots",
      "Payment reference or UTR details",
    ],
    account_hacking: [
      "Login alerts and account activity logs",
      "Password reset or recovery email screenshots",
      "Access history evidence",
    ],
    identity_theft: [
      "Identity misuse or impersonation records",
      "Correspondence showing unauthorized use",
      "Supporting account opening or verification records",
    ],
    ransomware: [
      "Ransom note",
      "Encrypted sample files",
      "Endpoint or antivirus logs",
    ],
    default: [
      "Screenshots and supporting documents",
      "Communication logs",
      "Original incident artifacts",
    ],
  };

  evidence.push(...(categoryEvidence[category] || categoryEvidence.default));

  return uniqueStrings(evidence).slice(0, 6);
}

function inferAssetsAffected(
  category: string,
  text: string,
  report: Record<string, any>,
  signals: ReturnType<typeof extractSignals>,
): string[] {
  const assets: string[] = [];
  const lower = text.toLowerCase();
  const entities = report.entities || report.extractedDetails || {};

  if (lower.includes("email") || signals.emails.length > 0)
    assets.push("Email account");
  if (
    lower.includes("bank") ||
    lower.includes("upi") ||
    signals.amounts.length > 0
  )
    assets.push("Bank account / payment account");
  if (
    lower.includes("phone") ||
    lower.includes("sms") ||
    signals.phones.length > 0
  )
    assets.push("Mobile phone");
  if (
    lower.includes("workstation") ||
    lower.includes("computer") ||
    lower.includes("laptop") ||
    lower.includes("desktop")
  )
    assets.push("User workstation");
  if (
    lower.includes("file") ||
    lower.includes("document") ||
    signals.fileNames.length > 0
  )
    assets.push("Documents and files");
  if (
    lower.includes("drive") ||
    lower.includes("shared") ||
    lower.includes("server")
  )
    assets.push("Shared network drive / server");
  if (
    lower.includes("cloud") ||
    lower.includes("storage") ||
    lower.includes("onedrive") ||
    lower.includes("google drive")
  )
    assets.push("Cloud storage");

  if (category === "phishing") assets.push("Credentials", "Browser session");
  if (category === "financial_fraud")
    assets.push("Financial accounts", "Transaction records");
  if (category === "account_hacking")
    assets.push("User account", "Recovery channels");
  if (category === "identity_theft")
    assets.push("Identity records", "Personal profile data");
  if (category === "ransomware")
    assets.push("Local files", "Network shares", "Backup repository");

  if (entities.organization)
    assets.push(`${cleanText(entities.organization)} systems`);

  return uniqueStrings(assets).slice(0, 7);
}

function buildTechnicalAnalysis(
  category: string,
  text: string,
  signals: ReturnType<typeof extractSignals>,
): Record<string, any> {
  const lower = text.toLowerCase();
  const analysis: Record<string, any> = {};

  const deliveryMechanism =
    lower.includes("email") || signals.emails.length > 0
      ? "Email"
      : lower.includes("sms") || lower.includes("message")
        ? "SMS / Messaging"
        : lower.includes("link") || signals.urls.length > 0
          ? "Malicious link"
          : lower.includes("attachment") || signals.fileNames.length > 0
            ? "Malicious attachment"
            : INFORMATION_NOT_AVAILABLE;

  analysis.attackMethod =
    category === "phishing"
      ? "Social engineering and credential harvesting"
      : category === "financial_fraud"
        ? "Fraudulent payment manipulation or impersonation"
        : category === "account_hacking"
          ? "Unauthorized access through credential compromise"
          : category === "ransomware"
            ? "Malware execution and encryption of files"
            : category === "identity_theft"
              ? "Identity misuse and impersonation"
              : INFORMATION_NOT_AVAILABLE;

  analysis.deliveryMechanism = deliveryMechanism;
  analysis.payload =
    category === "ransomware"
      ? "Encryption payload"
      : category === "financial_fraud"
        ? "Payment diversion or unauthorized transfer"
        : category === "account_hacking"
          ? "Credential theft payload"
          : lower.includes("attachment")
            ? "Suspicious attachment"
            : INFORMATION_NOT_AVAILABLE;
  analysis.malwareBehaviour =
    category === "ransomware"
      ? "File encryption, lockout, and ransom notice generation"
      : lower.includes("malware")
        ? "Suspicious execution and persistence attempts"
        : INFORMATION_NOT_AVAILABLE;
  analysis.persistence =
    lower.includes("startup") || lower.includes("scheduled task")
      ? "Possible persistence mechanism mentioned or implied"
      : INFORMATION_NOT_AVAILABLE;
  analysis.encryptionActivity =
    category === "ransomware" || lower.includes("encrypted")
      ? "Encryption activity indicated"
      : INFORMATION_NOT_AVAILABLE;
  analysis.privilegeEscalation =
    lower.includes("admin") || lower.includes("privilege")
      ? "Possible privilege escalation indicators observed"
      : INFORMATION_NOT_AVAILABLE;
  analysis.lateralMovement =
    lower.includes("shared drive") || lower.includes("network")
      ? "Potential lateral movement across network resources"
      : INFORMATION_NOT_AVAILABLE;
  analysis.affectedNetworkResources = uniqueStrings([
    lower.includes("network") ? "Network resources" : undefined,
    lower.includes("server") ? "Servers" : undefined,
    lower.includes("drive") ? "Shared drives" : undefined,
    lower.includes("cloud") ? "Cloud storage" : undefined,
  ]);

  return analysis;
}

function buildImpactAssessment(
  category: string,
  text: string,
  report: Record<string, any>,
  signals: ReturnType<typeof extractSignals>,
): Record<string, any> {
  const lower = text.toLowerCase();
  const severity = inferSeverityFromSignals(category, text, signals);
  const money =
    signals.amounts[0] ||
    report.entities?.amountLost ||
    report.extractedDetails?.amountLost ||
    "Information not available";

  return {
    businessImpact:
      category === "ransomware"
        ? "Potential interruption of business operations and system availability."
        : category === "financial_fraud"
          ? "Potential exposure of payment workflows and financial controls."
          : category === "account_hacking"
            ? "Potential unauthorized access to business or personal accounts."
            : "Operational impact observed or implied from the incident narrative.",
    financialImpact: isUnavailable(money)
      ? "Information not available"
      : `Loss or exposure indicated around ${money}.`,
    operationalImpact:
      category === "ransomware"
        ? "Workstation or shared resource disruption likely affecting normal operations."
        : category === "phishing"
          ? "Credential compromise may lead to follow-on access attempts or account misuse."
          : "Operational disruption or monitoring requirements likely.",
    dataAvailability:
      category === "ransomware"
        ? "Potentially impacted by file encryption or locking."
        : lower.includes("delete") || lower.includes("lost")
          ? "Potential data loss or unavailability described."
          : "No confirmed loss of availability identified.",
    confidentiality:
      category === "phishing" ||
      category === "account_hacking" ||
      category === "identity_theft"
        ? "Confidential information may have been exposed or requested."
        : "Confidentiality impact not fully confirmed.",
    integrity:
      lower.includes("modified") ||
      lower.includes("changed") ||
      lower.includes("tampered")
        ? "Data integrity may have been affected."
        : "No explicit integrity compromise identified.",
    overallSeverityScore: severity.label,
    severityRationale: severity.rationale,
  };
}

function buildRecommendedNextSteps(
  category: string,
  text: string,
  report: Record<string, any>,
): string[] {
  const lower = text.toLowerCase();
  const base =
    INCIDENT_RESPONSE_STEPS[category] || INCIDENT_RESPONSE_STEPS.default;
  const steps = new Set<string>([
    ...(report.recommendedNextSteps || []),
    ...(report.nextSteps || []),
    ...base.nextSteps,
  ]);

  if (category === "phishing") {
    steps.add(
      "Preserve the original email, message headers, and URL evidence.",
    );
    steps.add(
      "Reset any credentials that may have been entered on the suspicious page.",
    );
  }
  if (category === "financial_fraud") {
    steps.add(
      "Contact the bank or payment provider immediately to freeze or dispute suspicious transfers.",
    );
    steps.add(
      "Preserve transaction IDs, screenshots, and beneficiary details for reporting.",
    );
  }
  if (category === "account_hacking") {
    steps.add(
      "Review login sessions and revoke all unknown devices or app sessions.",
    );
    steps.add("Enable multifactor authentication on all critical accounts.");
  }
  if (category === "ransomware") {
    steps.add(
      "Isolate affected endpoints and preserve encrypted samples and ransom notes.",
    );
    steps.add(
      "Restore only from verified offline backups after forensic imaging.",
    );
  }
  if (category === "identity_theft") {
    steps.add(
      "Notify banks, service providers, and relevant authorities about the misuse of identity data.",
    );
    steps.add(
      "Monitor accounts and credit activity for unauthorized openings or changes.",
    );
  }

  if (lower.includes("bank"))
    steps.add("Review linked accounts and contact the bank fraud desk.");
  if (lower.includes("workstation") || lower.includes("computer"))
    steps.add(
      "Perform a malware scan and preserve forensic images before remediation.",
    );
  if (lower.includes("email"))
    steps.add(
      "Inspect the sender address, message headers, and mailbox forwarding rules.",
    );

  return Array.from(steps).filter(Boolean).slice(0, 8);
}

function buildImmediateActionsTaken(
  category: string,
  text: string,
  report: Record<string, any>,
): string[] {
  const lower = text.toLowerCase();
  const actions = new Set<string>(report.immediateActionsTaken || []);

  if (category === "phishing")
    actions.add("Suspicious message preserved for analysis.");
  if (category === "financial_fraud")
    actions.add(
      "Bank or payment activity reviewed for unauthorized transactions.",
    );
  if (category === "account_hacking")
    actions.add(
      "Account passwords or recovery options were reviewed or reset.",
    );
  if (category === "ransomware")
    actions.add("Potentially affected device isolated from the network.");
  if (category === "identity_theft")
    actions.add("Identity misuse or impersonation records preserved.");

  if (lower.includes("reported"))
    actions.add("Incident escalation or reporting initiated.");
  if (lower.includes("password"))
    actions.add("Credential-related control action taken or advised.");
  if (lower.includes("bank"))
    actions.add(
      "Relevant financial institution notified or prepared for notification.",
    );

  return Array.from(actions).filter(Boolean).slice(0, 6);
}

function buildProfessionalFirDraft(
  report: Record<string, any>,
  sourceText: string,
  category: string,
): string {
  const executive = report.executiveSummary || {};
  const classification = report.classification || {};
  const entities = report.entities || report.extractedDetails || {};
  const victim =
    cleanText(executive.victim || entities.victimName || entities.victim) ||
    "the undersigned";
  const organization = cleanText(
    executive.organization || entities.organization,
  );
  const incidentLabel = titleCase(
    cleanText(
      classification.primaryAttack ||
        report.incidentType ||
        category ||
        "cyber incident",
    ) || "cyber incident",
  );
  const attackVector =
    cleanText(
      executive.attackVector ||
        classification.initialAttackVector ||
        report.modeOfAttack,
    ) || INFORMATION_NOT_AVAILABLE;
  const severity =
    cleanText(
      executive.severityLevel ||
        classification.severity ||
        report.impactAssessment?.overallSeverityScore,
    ) || "Medium";
  const summary = cleanText(
    executive.overallImpact || report.impact || sourceText,
  );
  const timeline = Array.isArray(report.incidentTimeline)
    ? report.incidentTimeline
    : [];
  const evidence = uniqueStrings([
    ...(report.evidenceSummary || []),
    ...(report.immediateActionsTaken || []),
  ]);
  const nextSteps = uniqueStrings([
    ...(report.recommendedNextSteps || []),
    ...(report.nextSteps || []),
  ]);

  const timelineText =
    timeline.length > 0
      ? timeline
          .slice(0, 4)
          .map((item: any) => cleanText(item.event || item.time || ""))
          .filter(Boolean)
          .join("; ")
      : "The incident sequence was assessed from the incident description and preserved artifacts.";

  const evidenceText =
    evidence.length > 0
      ? evidence.slice(0, 4).join("; ")
      : "Relevant screenshots, communications, logs, and other artifacts should be preserved for investigation.";

  const nextActionText =
    nextSteps.length > 0
      ? nextSteps.slice(0, 4).join(" ")
      : "Preserve evidence, notify the relevant service provider or bank, and file the complaint with the appropriate cybercrime authority.";

  return [
    "To, The Officer-in-Charge, Cyber Crime Police Station.",
    `Subject: Complaint regarding ${incidentLabel}.`,
    `I, ${victim}${organization ? ` of ${organization}` : ""}, respectfully submit this complaint regarding a cyber incident assessed as ${severity}.`,
    `The incident appears to involve ${incidentLabel.toLowerCase()} with an initial vector of ${attackVector}. The available summary indicates: ${summary}.`,
    `Chronology and relevant observations: ${timelineText}.`,
    `Preserved evidence and artifacts: ${evidenceText}.`,
    `I request that the matter be investigated and that necessary legal and technical action be taken against the responsible party.`,
    `Recommended next steps have been identified for containment and investigation, including: ${nextActionText}.`,
    `Yours faithfully,`,
    victim,
  ].join("\n\n");
}

function countTruthySections(report: Record<string, any>): number {
  const keys = [
    report.executiveSummary,
    report.classification,
    report.entities,
    report.incidentTimeline,
    report.technicalAnalysis,
    report.iocs,
    report.assetsAffected,
    report.impactAssessment,
    report.evidenceSummary,
    report.immediateActionsTaken,
    report.recommendedNextSteps,
    report.firDraft || report.description,
    report.annexure,
  ];

  return keys.filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object")
      return Object.keys(value).length > 0;
    return Boolean(value);
  }).length;
}

function computeConfidenceScore(
  report: Record<string, any>,
  sourceText: string,
  signals: ReturnType<typeof extractSignals>,
): number {
  const modelScore =
    typeof report.aiConfidenceScore === "number" &&
    Number.isFinite(report.aiConfidenceScore)
      ? clamp(Math.round(report.aiConfidenceScore), 0, 100)
      : 0;
  const sectionScore = clamp(48 + countTruthySections(report) * 3, 48, 92);
  const signalScore = clamp(
    44 +
      (signals.emails.length +
        signals.urls.length +
        signals.fileNames.length +
        signals.amounts.length +
        signals.ipAddresses.length) *
        5,
    44,
    96,
  );
  const textScore = sourceText.length > 240 ? 72 : 58;

  const blended = modelScore
    ? Math.round(
        modelScore * 0.35 +
          sectionScore * 0.4 +
          signalScore * 0.2 +
          textScore * 0.05,
      )
    : Math.round(sectionScore * 0.45 + signalScore * 0.4 + textScore * 0.15);

  return clamp(blended, 35, 98);
}

function normalizeGeneratedReport(
  report: Record<string, any>,
  fallbackDescription: string,
) {
  const sourceText = [
    fallbackDescription,
    report.description,
    report.firDraft,
    report.generatedReportText,
    JSON.stringify(report.entities || report.extractedDetails || {}),
  ]
    .filter(Boolean)
    .join("\n");

  const signals = extractSignals(sourceText);
  const category = cleanText(
    report.classification?.primaryAttack || report.incidentType || "other",
  ).toLowerCase();

  const mergedEntities = {
    ...(report.entities || {}),
    ...(report.extractedDetails || {}),
  };

  const inferredSeverity = inferSeverityFromSignals(
    category,
    sourceText,
    signals,
  );
  const firDraftSource = cleanText(
    report.firDraft || report.description || report.generatedReportText,
  );
  const copiedDraft =
    firDraftSource &&
    cleanText(fallbackDescription) &&
    (firDraftSource
      .toLowerCase()
      .includes(cleanText(fallbackDescription).toLowerCase().slice(0, 80)) ||
      firDraftSource.length < 220);

  const firDraft = copiedDraft
    ? buildProfessionalFirDraft(report, sourceText, category)
    : firDraftSource || buildProfessionalFirDraft(report, sourceText, category);

  const executiveSummary = report.executiveSummary || {};
  const classification = report.classification || {};
  const assetsAffected =
    Array.isArray(report.assetsAffected) && report.assetsAffected.length > 0
      ? report.assetsAffected
      : inferAssetsAffected(category, sourceText, report, signals);
  const incidentTimeline =
    Array.isArray(report.incidentTimeline) && report.incidentTimeline.length > 0
      ? report.incidentTimeline
      : buildTimeline(category, sourceText, signals);
  const evidenceSummary =
    Array.isArray(report.evidenceSummary) && report.evidenceSummary.length > 0
      ? report.evidenceSummary
      : buildEvidenceSummary(category, sourceText, signals);
  const immediateActionsTaken =
    Array.isArray(report.immediateActionsTaken) &&
    report.immediateActionsTaken.length > 0
      ? report.immediateActionsTaken
      : buildImmediateActionsTaken(category, sourceText, report);
  const recommendedNextSteps =
    Array.isArray(report.recommendedNextSteps) &&
    report.recommendedNextSteps.length > 0
      ? report.recommendedNextSteps
      : buildRecommendedNextSteps(category, sourceText, report);
  const technicalAnalysis =
    report.technicalAnalysis && Object.keys(report.technicalAnalysis).length > 0
      ? report.technicalAnalysis
      : buildTechnicalAnalysis(category, sourceText, signals);
  const impactAssessment =
    report.impactAssessment && Object.keys(report.impactAssessment).length > 0
      ? report.impactAssessment
      : buildImpactAssessment(category, sourceText, report, signals);
  const annexure =
    Array.isArray(report.annexure) && report.annexure.length > 0
      ? report.annexure
      : uniqueStrings([
          ...evidenceSummary,
          ...assetsAffected,
          signals.fileNames.length > 0
            ? "Suspicious file attachments"
            : undefined,
          signals.urls.length > 0 ? "URLs and links" : undefined,
          signals.emails.length > 0 ? "Email correspondence" : undefined,
          signals.ipAddresses.length > 0 ? "IP address evidence" : undefined,
        ]);

  const aiConfidenceScore = computeConfidenceScore(
    {
      ...report,
      firDraft,
      incidentTimeline,
      evidenceSummary,
      immediateActionsTaken,
      recommendedNextSteps,
    },
    sourceText,
    signals,
  );

  return {
    ...report,
    incidentType:
      cleanText(report.incidentType) ||
      cleanText(classification.primaryAttack) ||
      "other",
    description: firDraft,
    firDraft,
    generatedReportText: report.generatedReportText || firDraft,
    aiConfidenceScore,
    executiveSummary: {
      incidentType:
        cleanText(executiveSummary.incidentType) ||
        cleanText(classification.primaryAttack) ||
        cleanText(report.incidentType),
      attackVector:
        cleanText(executiveSummary.attackVector) ||
        (category === "phishing"
          ? "Phishing email or message"
          : category === "financial_fraud"
            ? "Fraudulent payment request or impersonation"
            : category === "account_hacking"
              ? "Credential compromise"
              : category === "ransomware"
                ? "Malicious attachment or payload execution"
                : category === "identity_theft"
                  ? "Impersonation or identity misuse"
                  : INFORMATION_NOT_AVAILABLE),
      severityLevel:
        cleanText(executiveSummary.severityLevel) || inferredSeverity.label,
      dateAndTime:
        cleanText(executiveSummary.dateAndTime) ||
        cleanText(report.entities?.date) ||
        cleanText(report.entities?.time) ||
        signals.dates[0] ||
        signals.times[0] ||
        INFORMATION_NOT_AVAILABLE,
      victim:
        cleanText(executiveSummary.victim) ||
        cleanText(mergedEntities.victimName) ||
        cleanText(mergedEntities.victim) ||
        INFORMATION_NOT_AVAILABLE,
      organization:
        cleanText(executiveSummary.organization) ||
        cleanText(mergedEntities.organization) ||
        INFORMATION_NOT_AVAILABLE,
      overallImpact:
        cleanText(executiveSummary.overallImpact) ||
        cleanText(impactAssessment.businessImpact) ||
        cleanText(impactAssessment.financialImpact) ||
        INFORMATION_NOT_AVAILABLE,
    },
    classification: {
      primaryAttack:
        cleanText(classification.primaryAttack) ||
        cleanText(report.incidentType) ||
        category ||
        "other",
      attackTypes: uniqueStrings([
        ...(Array.isArray(classification.attackTypes)
          ? classification.attackTypes
          : []),
        cleanText(classification.primaryAttack),
        category,
      ]),
      initialAttackVector:
        cleanText(classification.initialAttackVector) ||
        (category === "phishing"
          ? "Phishing communication"
          : category === "financial_fraud"
            ? "Fraudulent payment or impersonation channel"
            : category === "account_hacking"
              ? "Compromised credentials"
              : category === "ransomware"
                ? "Malicious attachment or execution"
                : category === "identity_theft"
                  ? "Identity misuse or impersonation"
                  : INFORMATION_NOT_AVAILABLE),
      severity: cleanText(classification.severity) || inferredSeverity.label,
    },
    entities: mergedEntities,
    incidentTimeline,
    technicalAnalysis,
    iocs: {
      ...(report.iocs || {}),
      maliciousFileNames: uniqueStrings([
        ...((report.iocs?.maliciousFileNames as string[]) || []),
        ...signals.fileNames,
      ]),
      fileExtensions: uniqueStrings([
        ...((report.iocs?.fileExtensions as string[]) || []),
        ...signals.fileExtensions,
      ]),
      domains: uniqueStrings([
        ...((report.iocs?.domains as string[]) || []),
        ...signals.domains,
      ]),
      urls: uniqueStrings([
        ...((report.iocs?.urls as string[]) || []),
        ...signals.urls,
      ]),
      ipAddresses: uniqueStrings([
        ...((report.iocs?.ipAddresses as string[]) || []),
        ...signals.ipAddresses,
      ]),
      registryKeys: uniqueStrings(report.iocs?.registryKeys || []),
      hashes: uniqueStrings([
        ...((report.iocs?.hashes as string[]) || []),
        ...signals.hashes,
      ]),
      emailSubjects: uniqueStrings(report.iocs?.emailSubjects || []),
      emailHeaders: uniqueStrings(report.iocs?.emailHeaders || []),
      suspiciousAttachments: uniqueStrings([
        ...((report.iocs?.suspiciousAttachments as string[]) || []),
        ...(signals.fileNames.length > 0 ? signals.fileNames : []),
      ]),
      walletAddresses: uniqueStrings([
        ...((report.iocs?.walletAddresses as string[]) || []),
        ...signals.walletAddresses,
      ]),
    },
    assetsAffected,
    impactAssessment,
    evidenceSummary,
    immediateActionsTaken,
    recommendedNextSteps,
    annexure,
    nextSteps: recommendedNextSteps,
    extractedDetails: mergedEntities,
    modeOfAttack:
      cleanText(report.modeOfAttack) ||
      cleanText(technicalAnalysis.deliveryMechanism) ||
      INFORMATION_NOT_AVAILABLE,
    impact:
      cleanText(report.impact) ||
      cleanText(impactAssessment.financialImpact) ||
      cleanText(impactAssessment.operationalImpact) ||
      INFORMATION_NOT_AVAILABLE,
    suggestedCategory:
      cleanText(report.suggestedCategory) ||
      cleanText(classification.primaryAttack) ||
      category ||
      "other",
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // 1. Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // 2. Setup Chat
  registerChatRoutes(app);

  // 3. Application Routes (Reports)

  // List Reports
  app.get(api.reports.list.path, isAuthenticated, async (req, res) => {
    const userId = (req.session as any)?.user?.id;
    const reports = await storage.getReports(userId);
    res.json(reports);
  });

  // Get Single Report
  app.get(api.reports.get.path, isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    const report = await storage.getReport(id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Security check: ensure report belongs to user
    const userId = (req.session as any)?.user?.id;
    if (report.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized access to report" });
    }

    res.json(report);
  });

  // Generate Report Analysis (AI)
  app.post(api.reports.generate.path, isAuthenticated, async (req, res) => {
    try {
      const { description } = api.reports.generate.input.parse(req.body);

      const prompt = buildFirPrompt(description);

      let structuredData: any;
      if (openai) {
        const completion = await openai.chat.completions.create({
          model: "gpt-5.1",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        });

        const responseContent = completion.choices[0].message.content;
        if (!responseContent) throw new Error("Empty response from AI");

        structuredData = normalizeGeneratedReport(
          safeParseGeneratedReport(responseContent),
          description,
        );
      } else {
        // Fallback simple analysis when OpenAI not configured
        const text = description.toLowerCase();
        let fallbackCategory = "other";
        if (
          text.includes("phish") ||
          text.includes("link") ||
          text.includes("sms")
        )
          fallbackCategory = "phishing";
        else if (
          text.includes("financial") ||
          text.includes("fraud") ||
          text.includes("bank") ||
          text.includes("transaction") ||
          text.includes("otp") ||
          text.includes("rupee") ||
          text.includes("rs.")
        )
          fallbackCategory = "financial_fraud";
        else if (
          text.includes("hack") ||
          text.includes("compromise") ||
          text.includes("account")
        )
          fallbackCategory = "account_hacking";
        else if (
          text.includes("identity") ||
          text.includes("aadhar") ||
          text.includes("pan")
        )
          fallbackCategory = "identity_theft";
        else if (text.includes("email")) fallbackCategory = "email_compromise";

        structuredData = {
          incidentType: fallbackCategory,
          description: `To, The Officer-in-Charge, Cyber Crime Police Station. Subject: Complaint regarding ${fallbackCategory}. ${description}`,
          firDraft: `To, The Officer-in-Charge, Cyber Crime Police Station. Subject: Complaint regarding ${fallbackCategory}. ${description}`,
          aiConfidenceScore: 35,
          classification: {
            primaryAttack: fallbackCategory,
            attackTypes: [fallbackCategory],
            initialAttackVector:
              "Information not available at the time of reporting",
            severity: "Medium",
          },
          executiveSummary: {
            incidentType: fallbackCategory,
            attackVector: "Information not available at the time of reporting",
            severityLevel: "Medium",
            dateAndTime: "Information not available at the time of reporting",
            victim: "Information not available at the time of reporting",
            organization: "Information not available at the time of reporting",
            overallImpact: description,
          },
          entities: {},
          incidentTimeline: [],
          technicalAnalysis: {},
          iocs: {},
          assetsAffected: [],
          impactAssessment: {},
          evidenceSummary: [],
          immediateActionsTaken: [],
          recommendedNextSteps: [],
          annexure: [],
        };

        structuredData = normalizeGeneratedReport(structuredData, description);
      }

      // INCIDENT RESPONSE MODULE:
      // We map the detected incident to expert-vetted guidance.
      // We use a more robust matching strategy to ensure the user gets help even if the AI's label varies slightly.
      let category = (structuredData.incidentType || "").toLowerCase();

      // Standardize the category for better matching based on keywords in description or AI result
      const fullText = (
        category +
        " " +
        (structuredData.description || "") +
        " " +
        description
      ).toLowerCase();

      if (
        fullText.includes("phish") ||
        fullText.includes("link") ||
        fullText.includes("sms")
      )
        category = "phishing";
      else if (
        fullText.includes("financial") ||
        fullText.includes("fraud") ||
        fullText.includes("money") ||
        fullText.includes("bank") ||
        fullText.includes("transaction") ||
        fullText.includes("otp") ||
        fullText.includes("debit") ||
        fullText.includes("rs.") ||
        fullText.includes("rupees") ||
        fullText.includes("payment")
      )
        category = "financial_fraud";
      else if (
        fullText.includes("hack") ||
        fullText.includes("compromise") ||
        fullText.includes("social media") ||
        fullText.includes("instagram") ||
        fullText.includes("facebook") ||
        fullText.includes("account") ||
        fullText.includes("stolen")
      )
        category = "account_hacking";
      else if (
        fullText.includes("identity") ||
        fullText.includes("theft") ||
        fullText.includes("impersonat") ||
        fullText.includes("aadhar") ||
        fullText.includes("pan")
      )
        category = "identity_theft";
      else if (fullText.includes("email")) category = "email_compromise";
      else if (
        fullText.includes("fedex") ||
        fullText.includes("courier") ||
        fullText.includes("drugs") ||
        fullText.includes("illegal") ||
        fullText.includes("police call") ||
        fullText.includes("arrest")
      )
        category = "financial_fraud";

      const isUncertain =
        !category || category === "other" || category === "unknown";
      const guidance = isUncertain
        ? getResponseGuidance("financial_fraud")
        : getResponseGuidance(category);

      // Add a fallback for the AI response if guidance is still null but we matched a category
      const finalGuidance = guidance;

      structuredData.guidance = finalGuidance;
      structuredData.incidentType = category.toUpperCase();
      structuredData.description =
        structuredData.firDraft || structuredData.description;
      structuredData.firDraft =
        structuredData.firDraft || structuredData.description;

      res.json({
        incidentType: category,
        structuredReport: structuredData,
      });
    } catch (error) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ message: "Failed to generate report analysis" });
    }
  });

  // Create/Save Report
  app.post(api.reports.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.reports.create.input.parse(req.body);

      const prompt = buildFirPrompt(input.rawDescription);

      let structuredData: any = {};
      if (openai) {
        const completion = await openai.chat.completions.create({
          model: "gpt-5.1",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        });

        structuredData = normalizeGeneratedReport(
          safeParseGeneratedReport(
            completion.choices[0].message.content || "{}",
          ),
          input.rawDescription,
        );
      } else {
        const text = input.rawDescription.toLowerCase();
        let fallbackCategory = "other";
        if (
          text.includes("phish") ||
          text.includes("link") ||
          text.includes("sms")
        )
          fallbackCategory = "phishing";
        else if (
          text.includes("financial") ||
          text.includes("fraud") ||
          text.includes("bank") ||
          text.includes("transaction") ||
          text.includes("otp") ||
          text.includes("rupee") ||
          text.includes("rs.")
        )
          fallbackCategory = "financial_fraud";
        else if (
          text.includes("hack") ||
          text.includes("compromise") ||
          text.includes("account")
        )
          fallbackCategory = "account_hacking";
        else if (
          text.includes("identity") ||
          text.includes("aadhar") ||
          text.includes("pan")
        )
          fallbackCategory = "identity_theft";
        else if (text.includes("email")) fallbackCategory = "email_compromise";

        structuredData = {
          incidentType: fallbackCategory,
          description: `To, The Officer-in-Charge, Cyber Crime Police Station. Subject: Complaint regarding ${fallbackCategory}. ${input.rawDescription}`,
          firDraft: `To, The Officer-in-Charge, Cyber Crime Police Station. Subject: Complaint regarding ${fallbackCategory}. ${input.rawDescription}`,
          aiConfidenceScore: 35,
          classification: {
            primaryAttack: fallbackCategory,
            attackTypes: [fallbackCategory],
            initialAttackVector:
              "Information not available at the time of reporting",
            severity: "Medium",
          },
          executiveSummary: {
            incidentType: fallbackCategory,
            attackVector: "Information not available at the time of reporting",
            severityLevel: "Medium",
            dateAndTime: "Information not available at the time of reporting",
            victim: "Information not available at the time of reporting",
            organization: "Information not available at the time of reporting",
            overallImpact: input.rawDescription,
          },
          entities: {},
          incidentTimeline: [],
          technicalAnalysis: {},
          iocs: {},
          assetsAffected: [],
          impactAssessment: {},
          evidenceSummary: [],
          immediateActionsTaken: [],
          recommendedNextSteps: [],
          annexure: [],
        };

        structuredData = normalizeGeneratedReport(
          structuredData,
          input.rawDescription,
        );
      }

      // Standardize the category for better matching
      let category = (structuredData.incidentType || "").toLowerCase();
      const fullText = (
        category +
        " " +
        (structuredData.description || "") +
        " " +
        input.rawDescription
      ).toLowerCase();

      if (
        fullText.includes("phish") ||
        fullText.includes("link") ||
        fullText.includes("sms")
      )
        category = "phishing";
      else if (
        fullText.includes("financial") ||
        fullText.includes("fraud") ||
        fullText.includes("money") ||
        fullText.includes("bank") ||
        fullText.includes("transaction") ||
        fullText.includes("otp") ||
        fullText.includes("debit") ||
        fullText.includes("rs.") ||
        fullText.includes("rupees") ||
        fullText.includes("payment")
      )
        category = "financial_fraud";
      else if (
        fullText.includes("hack") ||
        fullText.includes("compromise") ||
        fullText.includes("social media") ||
        fullText.includes("instagram") ||
        fullText.includes("facebook") ||
        fullText.includes("account") ||
        fullText.includes("stolen")
      )
        category = "account_hacking";
      else if (
        fullText.includes("identity") ||
        fullText.includes("theft") ||
        fullText.includes("impersonat") ||
        fullText.includes("aadhar") ||
        fullText.includes("pan")
      )
        category = "identity_theft";
      else if (fullText.includes("email")) category = "email_compromise";
      else if (
        fullText.includes("fedex") ||
        fullText.includes("courier") ||
        fullText.includes("drugs") ||
        fullText.includes("illegal") ||
        fullText.includes("arrest")
      )
        category = "financial_fraud";

      const isUncertain =
        !category || category === "other" || category === "unknown";
      const guidance = isUncertain
        ? getResponseGuidance("financial_fraud")
        : getResponseGuidance(category);
      structuredData.guidance = guidance;
      structuredData.description =
        structuredData.firDraft || structuredData.description;
      structuredData.firDraft =
        structuredData.firDraft || structuredData.description;

      const reportData = {
        userId: (req.session as any)?.user?.id,
        title: input.title,
        rawDescription: input.rawDescription,
        incidentType: category.toUpperCase(),
        structuredReport: structuredData,
        status: "draft",
      };

      const report = await storage.createReport(reportData);
      res.status(201).json(report);
    } catch (err) {
      console.error("Create Report Error:", err);
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  return httpServer;
}
