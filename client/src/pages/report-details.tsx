import { useRoute } from "wouter";
import { useReport } from "@/hooks/use-reports";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Printer,
  ShieldCheck,
  Clock,
  FileText,
  AlertCircle,
  Lock,
  Eye,
  CheckCircle2,
  Bot,
} from "lucide-react";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { FirDocument } from "@/components/fir-document";

function formatIncidentTypeLabel(value?: string) {
  if (!value) return "Cyber Crime";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function toPrintableText(value?: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "Information not available";
  }

  return value.trim();
}

function toPrintableList(value?: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export default function ReportDetails() {
  const [, params] = useRoute("/report/:id");
  const id = params ? parseInt(params.id) : 0;
  const { data: report, isLoading } = useReport(id);
  const [activeTab, setActiveTab] = useState<"report" | "response">("report");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold">Report Not Found</h2>
        <Link href="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const structured = report.structuredReport as any;
  const guidance = structured?.guidance;
  const extractedDetails = structured?.extractedDetails ?? {};
  const reportDate = report.createdAt
    ? format(new Date(report.createdAt), "PPP")
    : "N/A";
  const reportTime = report.createdAt
    ? format(new Date(report.createdAt), "p")
    : "";
  const incidentLabel = formatIncidentTypeLabel(
    report.incidentType || structured?.incidentType,
  );
  const evidenceItems = [
    ...toPrintableList(guidance?.evidence),
    ...toPrintableList(extractedDetails?.evidence),
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* ── Hidden Print Area ── rendered off-screen, visible only when printing ── */}
      <div id="fir-print-area" style={{ display: "none" }}>
        <div className="print-letter">
          <div className="print-header">
            <h1>Sample Cyber Crime Complaint Letter (Offline Filing)</h1>
            <div className="print-recipient">
              <p>To,</p>
              <p>The Head,</p>
              <p>Cyber Crime Cell,</p>
              <p>[City Name] Police Department,</p>
              <p>[Full Address of Cyber Crime Cell, if known]</p>
            </div>
            <div className="print-meta">
              <span>
                <strong>Date:</strong> {reportDate}
              </span>
              <span>
                <strong>Report ID:</strong> #{report.id}
              </span>
            </div>
            <p className="print-subject">
              <strong>Subject:</strong> Complaint Regarding {incidentLabel}
            </p>
          </div>

          <p>Respected Sir/Madam,</p>

          <p>
            I am writing to formally lodge a complaint regarding a cyber crime
            incident that has been reported through CyberDesk. The details of
            the incident are provided below for your kind perusal and necessary
            action.
          </p>

          <div className="print-section">
            <h2>1. Complainant Details:</h2>
            <p>
              <strong>Full Name:</strong> [Your Full Name]
            </p>
            <p>
              <strong>Contact Number:</strong> [Your Mobile Number]
            </p>
            <p>
              <strong>Email Address:</strong> [Your Email Address]
            </p>
            <p>
              <strong>Residential Address:</strong> [Your Full Address with PIN
              Code]
            </p>
            <p>
              <strong>ID Proof Enclosed:</strong> [Aadhaar/PAN/Voter ID -
              mention whichever attached]
            </p>
          </div>

          <div className="print-section">
            <h2>2. Incident Details:</h2>
            <p>
              <strong>Date & Time of Incident:</strong> {reportDate}{" "}
              {reportTime}
            </p>
            <p>
              <strong>Type of Cyber Crime:</strong> {incidentLabel}
            </p>
            <p>
              <strong>Description of Incident:</strong>
            </p>
            <p className="print-paragraph">
              {toPrintableText(
                structured?.description || report.rawDescription,
              )}
            </p>
          </div>

          <div className="print-section">
            <h2>3. Suspect Details (if known):</h2>
            <p className="print-paragraph">
              {toPrintableText(
                extractedDetails?.suspect_details ||
                  extractedDetails?.suspectDetails ||
                  extractedDetails?.suspect ||
                  "Information not available. Include any email ID, phone number, bank account, social media handle, or link if known.",
              )}
            </p>
          </div>

          <div className="print-section">
            <h2>4. Evidence Attached:</h2>
            <p>
              [List and enclose copies/screenshots of relevant documents or
              evidence, such as:]
            </p>
            <ul className="print-bullets">
              {(evidenceItems.length > 0
                ? evidenceItems
                : [
                    "Chat screenshots",
                    "Email transcripts",
                    "Bank transaction details",
                    "Fraudulent links or profiles",
                    "Call logs",
                    "Any other supporting evidence",
                  ]
              ).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <p>
            I assure you of my full cooperation in the investigation and am
            ready to provide any further information required.
          </p>

          <p>Thanking you,</p>

          <p>Yours sincerely,</p>
          <p>[Your Signature (if submitting physically)]</p>
          <p>[Your Full Name]</p>
          <p>[Contact Number]</p>
          <p>[Email Address]</p>

          <div className="print-section">
            <h2>Enclosures:</h2>
            <ol className="print-numbered">
              <li>Copy of ID proof</li>
              <li>Screenshots and documents (list them)</li>
              <li>[Any other documents attached]</li>
            </ol>
          </div>

          <div className="print-footer">
            Generated by CyberDesk for offline filing. Submit this complaint to
            the nearest Cyber Crime Police Station or the official cybercrime
            portal.
          </div>
        </div>
      </div>

      {/* ── Page Header ── */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{report.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {reportDate} {reportTime}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> ID: #{report.id}
            </span>
          </div>
        </div>
        <div className="ml-auto flex gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              const el = document.getElementById("fir-print-area");
              if (el) el.style.display = "block";
              window.print();
              if (el) el.style.display = "none";
            }}
          >
            <Printer className="w-4 h-4" /> Print Report
          </Button>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex gap-4 p-1 bg-muted rounded-xl w-fit mb-8">
        <Button
          variant={activeTab === "report" ? "default" : "ghost"}
          onClick={() => setActiveTab("report")}
          className="gap-2"
        >
          <FileText className="w-4 h-4" /> FIR Style Report
        </Button>
        <Button
          variant={activeTab === "response" ? "default" : "ghost"}
          onClick={() => setActiveTab("response")}
          className="gap-2"
        >
          <ShieldCheck className="w-4 h-4" /> Incident Response
        </Button>
      </div>

      {/* ── FIR Report Tab ── */}
      {activeTab === "report" ? (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-8 shadow-sm border-t-4 border-t-primary">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-border/50">
                <div>
                  <h2 className="text-xl font-bold font-display uppercase tracking-wider text-primary">
                    Incident Report (FIR)
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Dynamically Generated Official Document
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="px-3 py-1 text-sm font-mono"
                >
                  {structured?.incidentType}
                </Badge>
              </div>

              <div className="space-y-8">
                {structured?.description && (
                  <section>
                    <h3 className="text-sm font-bold uppercase text-muted-foreground mb-3">
                      Official Report Format
                    </h3>
                    <FirDocument
                      text={structured.description}
                      title="Official FIR Draft"
                    />
                  </section>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-secondary text-secondary-foreground">
              <h3 className="font-bold mb-2">Next Steps</h3>
              <p className="text-sm text-secondary-foreground/80 mb-4">
                Submit this report to your local police station or the National
                Cyber Crime Portal.
              </p>
              <Link href="/chat">
                <Button
                  variant="secondary"
                  className="w-full bg-white text-secondary hover:bg-white/90"
                >
                  Help me with filing
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      ) : (
        /* ── Incident Response Tab ── */
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {guidance ? (
              <Card className="p-6 border-l-4 border-l-orange-500 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />{" "}
                  Incident-Specific Guidance
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Based on the detected incident of{" "}
                  <strong>{structured?.incidentType}</strong>, here are the
                  structured precautions and actions you should take:
                </p>

                <div className="grid gap-8">
                  {guidance.immediate && (
                    <section className="bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                      <h4 className="text-sm font-bold uppercase text-red-600 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Immediate
                        Precautions (Containment)
                      </h4>
                      <ul className="list-disc pl-5 space-y-2 text-sm text-foreground/80">
                        {guidance.immediate.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {guidance.security && (
                    <section className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/10">
                      <h4 className="text-sm font-bold uppercase text-orange-600 mb-3 flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Security Actions
                      </h4>
                      <ul className="list-disc pl-5 space-y-2 text-sm text-foreground/80">
                        {guidance.security.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </section>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    {guidance.evidence && (
                      <section className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
                        <h4 className="text-sm font-bold uppercase text-blue-600 mb-3 flex items-center gap-2">
                          <Eye className="w-4 h-4" /> Evidence Preservation
                        </h4>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-foreground/80">
                          {guidance.evidence.map((s: string, i: number) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {guidance.nextSteps && (
                      <section className="bg-green-500/5 p-4 rounded-xl border border-green-500/10">
                        <h4 className="text-sm font-bold uppercase text-green-600 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Recovery & Next
                          Steps
                        </h4>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-foreground/80">
                          {guidance.nextSteps.map((s: string, i: number) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </div>
                </div>

                <div className="mt-8 p-4 bg-muted/50 rounded-xl text-xs text-muted-foreground italic flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                  <span>
                    Disclaimer: This guidance is for awareness and immediate
                    assistance only. Always follow official advice from
                    authorized agencies.
                  </span>
                </div>
              </Card>
            ) : (
              <Card className="p-6 border-l-4 border-l-blue-500 shadow-sm bg-blue-50/50">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-500" /> Guidance
                  Note
                </h3>
                <p className="text-sm text-muted-foreground">
                  The incident type could not be clearly identified from your
                  description. Please provide more specific details about the
                  incident in a new report to receive tailored response
                  guidance.
                </p>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-card border-l-4 border-l-primary shadow-sm">
              <h3 className="font-bold text-lg mb-4">Why this matters?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Structured response helps reduce further loss and ensures that
                digital evidence is preserved for investigation.
              </p>
              <Link href="/chat">
                <Button className="w-full gap-2">
                  <Bot className="w-4 h-4" /> Ask personal guidance
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
