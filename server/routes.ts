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
Analyze the incident below and generate a professional Cyber Incident Investigation Report followed by an FIR-style complaint.

Do NOT copy the user's paragraph directly.
Extract entities, classify the attack, infer severity, identify affected assets, and summarize the incident in investigation quality language.

Incident description:
"${description}"

Return ONLY valid JSON with the following top-level structure:
{
  "incidentType": "primary incident category",
  "description": "final FIR draft",
  "executiveSummary": {
    "incidentType": "",
    "attackVector": "",
    "severityLevel": "",
    "dateAndTime": "",
    "victim": "",
    "organization": "",
    "overallImpact": ""
  },
  "classification": {
    "primaryAttack": "",
    "attackTypes": [""],
    "initialAttackVector": "",
    "severity": ""
  },
  "entities": {
    "victimName": "",
    "organization": "",
    "department": "",
    "designation": "",
    "date": "",
    "time": "",
    "emailAddress": "",
    "phoneNumber": "",
    "maliciousFileName": "",
    "fileExtension": "",
    "domainNames": [""],
    "urls": [""],
    "ipAddresses": [""],
    "walletAddress": "",
    "bankAccount": "",
    "amountLost": "",
    "ransomAmount": "",
    "networkLocation": "",
    "operatingSystem": "",
    "fileExtensionCreated": "",
    "threatActor": ""
  },
  "incidentTimeline": [
    { "time": "", "event": "" }
  ],
  "technicalAnalysis": {
    "attackMethod": "",
    "deliveryMechanism": "",
    "payload": "",
    "malwareBehaviour": "",
    "persistence": "",
    "encryptionActivity": "",
    "privilegeEscalation": "",
    "lateralMovement": "",
    "affectedNetworkResources": [""]
  },
  "iocs": {
    "maliciousFileNames": [""],
    "fileExtensions": [""],
    "domains": [""],
    "urls": [""],
    "ipAddresses": [""],
    "registryKeys": [""],
    "hashes": [""],
    "emailSubjects": [""],
    "emailHeaders": [""],
    "suspiciousAttachments": [""],
    "walletAddresses": [""]
  },
  "assetsAffected": [""],
  "impactAssessment": {
    "businessImpact": "",
    "financialImpact": "",
    "operationalImpact": "",
    "dataAvailability": "",
    "confidentiality": "",
    "integrity": "",
    "overallSeverityScore": "",
    "severityRationale": ""
  },
  "evidenceSummary": [""],
  "immediateActionsTaken": [""],
  "recommendedNextSteps": [""],
  "firDraft": "",
  "annexure": [""],
  "aiConfidenceScore": 0,
  "modeOfAttack": "",
  "impact": "",
  "suggestedCategory": "",
  "nextSteps": [""],
  "generatedReportText": "",
  "extractedDetails": {}
}

Rules:
- Classify multiple attack types if needed.
- Use a Critical/High/Medium/Low severity label.
- If a field is unavailable, use "Information not available at the time of reporting".
- Make the FIR draft formal and submission-ready for the Cyber Crime Police Station.
- The FIR draft should be a polished legal complaint, not a copy of the user input.
- The report should be concise, readable, and suitable for law enforcement or incident response teams.
- If possible, infer likely victim, organization, and asset details from the text.
- Keep line breaks and section headings inside the FIR draft.

Respond ONLY with valid JSON.
`;
}

function normalizeGeneratedReport(
  report: Record<string, any>,
  fallbackDescription: string,
) {
  const firDraft = report.firDraft || report.description || fallbackDescription;

  return {
    ...report,
    incidentType: report.incidentType || "other",
    description: firDraft,
    firDraft,
    aiConfidenceScore:
      typeof report.aiConfidenceScore === "number"
        ? report.aiConfidenceScore
        : 75,
    recommendedNextSteps: Array.isArray(report.recommendedNextSteps)
      ? report.recommendedNextSteps
      : Array.isArray(report.nextSteps)
        ? report.nextSteps
        : [],
    evidenceSummary: Array.isArray(report.evidenceSummary)
      ? report.evidenceSummary
      : [],
    immediateActionsTaken: Array.isArray(report.immediateActionsTaken)
      ? report.immediateActionsTaken
      : [],
    annexure: Array.isArray(report.annexure) ? report.annexure : [],
    assetsAffected: Array.isArray(report.assetsAffected)
      ? report.assetsAffected
      : [],
    incidentTimeline: Array.isArray(report.incidentTimeline)
      ? report.incidentTimeline
      : [],
    entities: report.entities || report.extractedDetails || {},
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
          JSON.parse(responseContent),
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
          JSON.parse(completion.choices[0].message.content || "{}"),
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
