import { cn } from "@/lib/utils";

type TimelineEntry = {
  time?: string;
  event?: string;
};

type InvestigationReport = {
  incidentType?: string;
  description?: string;
  executiveSummary?: Record<string, any>;
  classification?: Record<string, any>;
  entities?: Record<string, any>;
  incidentTimeline?: TimelineEntry[];
  technicalAnalysis?: Record<string, any>;
  iocs?: Record<string, any>;
  assetsAffected?: string[];
  impactAssessment?: Record<string, any>;
  evidenceSummary?: string[];
  immediateActionsTaken?: string[];
  recommendedNextSteps?: string[];
  nextSteps?: string[];
  firDraft?: string;
  annexure?: string[];
  aiConfidenceScore?: number;
  generatedReportText?: string;
  extractedDetails?: Record<string, any>;
  guidance?: {
    immediate?: string[];
    security?: string[];
    evidence?: string[];
    nextSteps?: string[];
  };
};

type FirDocumentProps = {
  title?: string;
  reportId?: string | number;
  generatedAt?: string;
  structuredReport?: InvestigationReport | null;
  rawDescription?: string;
  className?: string;
};

const entityLabelMap: Record<string, string> = {
  victimName: "Victim Name",
  victim: "Victim",
  organization: "Organization",
  department: "Department",
  designation: "Designation",
  date: "Date",
  time: "Time",
  emailAddress: "Email Address",
  email: "Email Address",
  phoneNumber: "Phone Number",
  mobileNumber: "Phone Number",
  maliciousFileName: "Malicious File Name",
  fileExtension: "File Extension",
  domainNames: "Domain Names",
  urls: "URLs",
  ipAddresses: "IP Addresses",
  walletAddress: "Wallet Address",
  bankAccount: "Bank Account",
  amountLost: "Amount Lost",
  ransomAmount: "Ransom Amount",
  networkLocation: "Network Location",
  operatingSystem: "Operating System",
  fileExtensionCreated: "File Extension Created",
  threatActor: "Threat Actor",
  suspect_details: "Suspect Details",
};

const iocLabelMap: Record<string, string> = {
  maliciousFileNames: "Malicious File Names",
  fileExtensions: "File Extensions",
  domains: "Domains",
  urls: "URLs",
  ipAddresses: "IP Addresses",
  registryKeys: "Registry Keys",
  hashes: "Hashes",
  emailSubjects: "Email Subjects",
  emailHeaders: "Email Headers",
  suspiciousAttachments: "Suspicious Attachments",
  walletAddresses: "Bitcoin Wallet Addresses",
};

function titleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number")
    return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    const items = value.map((item) => formatValue(item)).filter(Boolean);
    return items.length > 0 ? items.join(", ") : "";
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map((item) => formatValue(item))
      .filter(Boolean)
      .join(", ");
  }
  return String(value);
}

function toList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((item) => {
      if (typeof item === "string") return item.trim() ? [item.trim()] : [];
      if (item && typeof item === "object") {
        const typedItem = item as Record<string, any>;
        const time = typedItem.time ? `${typedItem.time}`.trim() : "";
        const event = typedItem.event ? `${typedItem.event}`.trim() : "";
        const combined = [time, event].filter(Boolean).join(" - ");
        if (combined) return [combined];
      }
      const formatted = formatValue(item);
      return formatted && formatted !== "Information not available"
        ? [formatted]
        : [];
    })
    .filter(Boolean);
}

function toEntries(value: unknown): Array<[string, string]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];

  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, item]) => {
      const label = entityLabelMap[key] || iocLabelMap[key] || titleCase(key);
      const formatted = formatValue(item);
      if (!formatted || formatted === "Information not available") return [];
      return [[label, formatted]];
    },
  );
}

function renderKeyValueSection(
  title: string,
  entries: Array<[string, string]>,
  emptyFallback = "Information not available",
) {
  return (
    <>
      <h3>{title}</h3>

      {entries.length > 0 ? (
        <div className="report-key-values">
          {entries.map(([label, value]) => (
            <div key={`${label}-${value}`} className="report-key-value">
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="report-empty">{emptyFallback}</p>
      )}
    </>
  );
}

export function FirDocument({
  title = "Cyber Incident Investigation Report",
  reportId,
  generatedAt,
  structuredReport,
  rawDescription,
  className,
}: FirDocumentProps) {
  const report = structuredReport ?? {};
  const incidentType = report.incidentType || "";
  const severity =
    report.classification?.severity ||
    report.executiveSummary?.severityLevel ||
    report.impactAssessment?.severityScore ||
    "";
  const confidenceScore =
    typeof report.aiConfidenceScore === "number"
      ? `${Math.round(report.aiConfidenceScore)}%`
      : "";

  const complainant =
    report.executiveSummary?.victim ||
    report.entities?.victimName ||
    report.entities?.victim ||
    report.extractedDetails?.victimName ||
    "";

  const organization =
    report.executiveSummary?.organization ||
    report.entities?.organization ||
    report.extractedDetails?.organization ||
    "";

  const generatedStamp = generatedAt
    ? new Date(generatedAt).toLocaleString()
    : "";

  const coverDetails = [
    ["Report ID", reportId ? String(reportId) : "Information not available"],
    ["Generated Date & Time", generatedStamp],
    ["Severity", severity],
    ["Incident Category", incidentType],
    ["Complainant", complainant],
    ["Organization", organization],
    ["AI Confidence Score", confidenceScore],
  ] as Array<[string, string]>;

  const executiveSummaryEntries = [
    ["Incident Type", report.executiveSummary?.incidentType || incidentType],
    ["Attack Vector", report.executiveSummary?.attackVector],
    ["Severity Level", report.executiveSummary?.severityLevel || severity],
    ["Date and Time", report.executiveSummary?.dateAndTime],
    ["Victim", report.executiveSummary?.victim || complainant],
    ["Organization", report.executiveSummary?.organization || organization],
  ].filter(([, value]) => Boolean(value && `${value}`.trim())) as Array<
    [string, string]
  >;

  const classificationEntries = [
    ["Primary Attack", report.classification?.primaryAttack],
    [
      "Attack Types",
      Array.isArray(report.classification?.attackTypes)
        ? report.classification.attackTypes.join(", ")
        : undefined,
    ],
    ["Initial Attack Vector", report.classification?.initialAttackVector],
    ["Severity", report.classification?.severity || severity],
  ].filter(([, value]) => Boolean(value && `${value}`.trim())) as Array<
    [string, string]
  >;

  const entityEntries = toEntries(report.entities ?? report.extractedDetails);
  const timelineItems = toList(report.incidentTimeline).map((item) => item);
  const technicalEntries = toEntries(report.technicalAnalysis);
  const iocEntries = toEntries(report.iocs);
  const assetsAffected = toList(report.assetsAffected);
  const impactEntries = toEntries(report.impactAssessment);
  const evidenceSummary = toList(report.evidenceSummary);
  const immediateActionsTaken = toList(report.immediateActionsTaken);
  const recommendedSource = report.recommendedNextSteps?.length
    ? report.recommendedNextSteps
    : report.nextSteps;
  const recommendedNextSteps = toList(recommendedSource);
  const annexureItems = toList(report.annexure);
  const firDraft =
    report.firDraft || report.description || rawDescription || "";

  return (
    <div className={cn("report-sheet", className)}>
      <section className="report-cover">
        <div className="report-cover-badge">
          🛡️ Cyber Incident Investigation Report
        </div>
        <h1>{title}</h1>
        <p className="report-cover-subtitle">Generated by CyberDesk AI</p>
        <div className="report-cover-grid">
          {coverDetails.map(([label, value]) => (
            <div key={label} className="report-cover-item">
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="report-section">
        <h2>1. Executive Summary</h2>
        {renderKeyValueSection("Summary Overview", executiveSummaryEntries)}
        {report.executiveSummary?.overallImpact && (
          <>
            <h3>Overall Impact</h3>
            <p className="report-empty">
              {report.executiveSummary.overallImpact}
            </p>
          </>
        )}
      </section>

      <section className="report-section">
        <h2>2. Incident Classification</h2>
        {renderKeyValueSection("Classification", classificationEntries)}
      </section>

      <section className="report-section">
        <h2>3. Entity Extraction</h2>
        {entityEntries.length > 0 ? (
          <div className="report-key-values report-key-values-grid">
            {entityEntries.map(([label, value]) => (
              <div key={`${label}-${value}`} className="report-key-value">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="report-empty">Information not available</p>
        )}
      </section>

      <section className="report-section">
        <h2>4. Incident Timeline</h2>
        {timelineItems.length > 0 ? (
          <ol className="report-timeline">
            {timelineItems.map((item) => (
              <li key={item}>
                <span className="report-timeline-bullet" />
                <p>{item}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="report-empty">Information not available</p>
        )}
      </section>

      <section className="report-section">
        <h2>5. Technical Analysis</h2>
        {technicalEntries.length > 0 ? (
          <div className="report-key-values">
            {technicalEntries.map(([label, value]) => (
              <div key={`${label}-${value}`} className="report-key-value">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="report-empty">Information not available</p>
        )}
      </section>

      <section className="report-section">
        <h2>6. Indicators of Compromise (IOCs)</h2>
        {iocEntries.length > 0 ? (
          <div className="report-key-values">
            {iocEntries.map(([label, value]) => (
              <div key={`${label}-${value}`} className="report-key-value">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="report-empty">Information not available</p>
        )}
      </section>

      <section className="report-section">
        <h2>7. Assets Affected</h2>
        {assetsAffected.length > 0 ? (
          <ul className="report-list">
            {assetsAffected.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="report-empty">Information not available</p>
        )}
      </section>

      <section className="report-section">
        <h2>8. Impact Assessment</h2>
        {impactEntries.length > 0 ? (
          <div className="report-key-values">
            {impactEntries.map(([label, value]) => (
              <div key={`${label}-${value}`} className="report-key-value">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="report-empty">Information not available</p>
        )}
      </section>

      <section className="report-section">
        <h2>9. Evidence Summary</h2>
        {evidenceSummary.length > 0 ? (
          <ul className="report-list">
            {evidenceSummary.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="report-empty">Information not available</p>
        )}
      </section>

      <section className="report-section">
        <h2>10. Immediate Actions Taken</h2>
        {immediateActionsTaken.length > 0 ? (
          <ul className="report-list">
            {immediateActionsTaken.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="report-empty">Information not available</p>
        )}
      </section>

      <section className="report-section">
        <h2>11. Recommended Next Steps</h2>
        {recommendedNextSteps.length > 0 ? (
          <ul className="report-list">
            {recommendedNextSteps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="report-empty">Information not available</p>
        )}
      </section>

      <section className="report-section report-section-fir">
        <h2>12. FIR Draft</h2>
        <div className="report-fir-draft">
          {firDraft
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => (
              <p key={line}>{line}</p>
            ))}
        </div>
      </section>

      <section className="report-section">
        <h2>13. Annexure</h2>
        {annexureItems.length > 0 ? (
          <ol className="report-numbered-list">
            {annexureItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        ) : (
          <p className="report-empty">Information not available</p>
        )}
      </section>
    </div>
  );
}
