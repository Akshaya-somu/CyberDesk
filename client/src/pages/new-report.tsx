import { useState } from "react";
import { useLocation } from "wouter";
import { useGenerateReport, useCreateReport } from "@/hooks/use-reports";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Loader2,
  ArrowRight,
  Save,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
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

type Step = "input" | "processing" | "review";

export default function NewReport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("input");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);

  const generateReport = useGenerateReport();
  const createReport = useCreateReport();

  const handleGenerate = async () => {
    if (!title.trim() || !description.trim()) {
      toast({
        title: "Missing Information",
        description:
          "Please provide both a title and description of the incident.",
        variant: "destructive",
      });
      return;
    }

    setStep("processing");
    try {
      const result = await generateReport.mutateAsync(description);
      setAnalysis(result);
      setStep("review");
    } catch (error) {
      setStep("input");
    }
  };

  const handleSave = async () => {
    try {
      await createReport.mutateAsync({
        title,
        rawDescription: description,
      });
      setLocation("/dashboard");
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDownload = () => {
    const printArea = document.getElementById("fir-print-area");

    if (!printArea) return;

    printArea.style.display = "block";
    requestAnimationFrame(() => {
      window.print();
      printArea.style.display = "none";
    });
  };

  const incidentLabel = formatIncidentTypeLabel(
    analysis?.structuredReport?.incidentType,
  );
  const extractedDetails = analysis?.structuredReport?.extractedDetails ?? {};
  const guidance = analysis?.structuredReport?.guidance;
  const evidenceItems = [
    ...toPrintableList(guidance?.evidence),
    ...toPrintableList(extractedDetails?.evidence),
  ];

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-12">
        <div className="flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${step === "input" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-muted text-muted-foreground"}`}
          >
            1
          </div>
          <div className="w-16 h-1 bg-border rounded-full" />
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${step === "processing" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : step === "review" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
          >
            2
          </div>
          <div className="w-16 h-1 bg-border rounded-full" />
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${step === "review" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-muted text-muted-foreground"}`}
          >
            3
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h1 className="text-4xl font-display font-bold mb-3">
                Describe the Incident
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Tell us what happened in your own words. Our AI will structure
                it into a formal report and suggest next steps.
              </p>
            </div>

            <Card className="p-8 shadow-xl border-border/50 bg-card/50 backdrop-blur-sm">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80 ml-1">
                    Incident Title
                  </label>
                  <Input
                    placeholder="e.g., Suspicious Email from Bank"
                    className="h-12 text-lg input-modern"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80 ml-1">
                    Detailed Description
                  </label>
                  <Textarea
                    placeholder="Provide as much detail as possible. Who contacted you? What did they ask for? Did you click any links?..."
                    className="min-h-[250px] text-base leading-relaxed resize-none p-4 input-modern"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    size="lg"
                    onClick={handleGenerate}
                    className="btn-primary-glow font-bold text-lg px-8 h-14"
                  >
                    Analyze Report <Sparkles className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
              <div className="relative bg-card p-6 rounded-full border border-primary/20 shadow-2xl">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-3">Analyzing Incident...</h2>
            <p className="text-muted-foreground text-lg max-w-md">
              Our AI is reviewing your description, categorizing the threat, and
              generating a structured FIR report.
            </p>
          </motion.div>
        )}

        {step === "review" && analysis && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-display font-bold">
                  Analysis Complete
                </h1>
                <p className="text-muted-foreground">
                  Review the generated report and suggested actions.
                </p>
              </div>
              <Button
                onClick={handleSave}
                size="lg"
                className="btn-primary-glow bg-green-600 hover:bg-green-700"
              >
                <Save className="mr-2 w-5 h-5" /> Save to Dashboard
              </Button>
              <Button
                onClick={handleDownload}
                size="lg"
                variant="outline"
                className="ml-3 gap-2"
              >
                <ArrowRight className="w-5 h-5 rotate-45" /> Download FIR
              </Button>
            </div>

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
                      <strong>Date:</strong> {new Date().toLocaleDateString()}
                    </span>
                    <span>
                      <strong>Report Draft:</strong> {title || "New FIR"}
                    </span>
                  </div>
                  <p className="print-subject">
                    <strong>Subject:</strong> Complaint Regarding{" "}
                    {incidentLabel}
                  </p>
                </div>

                <p>Respected Sir/Madam,</p>

                <p>
                  I am writing to formally lodge a complaint regarding a cyber
                  crime incident that has been generated through CyberDesk. The
                  details of the incident are provided below for your kind
                  perusal and necessary action.
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
                    <strong>Residential Address:</strong> [Your Full Address
                    with PIN Code]
                  </p>
                  <p>
                    <strong>ID Proof Enclosed:</strong> [Aadhaar/PAN/Voter ID -
                    mention whichever attached]
                  </p>
                </div>

                <div className="print-section">
                  <h2>2. Incident Details:</h2>
                  <p>
                    <strong>Date & Time of Incident:</strong> [DD/MM/YYYY and
                    approx. time]
                  </p>
                  <p>
                    <strong>Type of Cyber Crime:</strong> {incidentLabel}
                  </p>
                  <p>
                    <strong>Description of Incident:</strong>
                  </p>
                  <p className="print-paragraph">
                    {toPrintableText(
                      analysis?.structuredReport?.description || description,
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
                    [List and enclose copies/screenshots of relevant documents
                    or evidence, such as:]
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
                  I assure you of my full cooperation in the investigation and
                  am ready to provide any further information required.
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
                  Generated by CyberDesk for offline filing. Submit this
                  complaint to the nearest Cyber Crime Police Station or the
                  official cybercrime portal.
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Structured Report Column */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6 border-l-4 border-l-primary shadow-lg bg-card/80">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                    <ShieldAlert className="w-6 h-6 text-primary" />
                    <h3 className="text-xl font-bold">
                      Structured Report (FIR Format)
                    </h3>
                  </div>

                  <div className="space-y-6">
                    {analysis.structuredReport.description && (
                      <FirDocument
                        title="Dynamic Official Report"
                        text={analysis.structuredReport.description}
                      />
                    )}
                  </div>
                </Card>

                {/* Incident Response Module */}
                {analysis.structuredReport.guidance && (
                  <Card className="p-6 border-l-4 border-l-orange-500 shadow-lg bg-card/80">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                      <AlertCircle className="w-6 h-6 text-orange-500" />
                      <h3 className="text-xl font-bold">
                        Incident Response Guidance
                      </h3>
                    </div>

                    <div className="space-y-6">
                      <section>
                        <h4 className="text-sm font-bold uppercase text-orange-600 mb-2">
                          Immediate Actions
                        </h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {analysis.structuredReport.guidance.immediate.map(
                            (s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ),
                          )}
                        </ul>
                      </section>
                      <section>
                        <h4 className="text-sm font-bold uppercase text-orange-600 mb-2">
                          Secure Your Accounts
                        </h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {analysis.structuredReport.guidance.security.map(
                            (s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ),
                          )}
                        </ul>
                      </section>
                      <section>
                        <h4 className="text-sm font-bold uppercase text-orange-600 mb-2">
                          Preserve Evidence
                        </h4>
                        <ul className="list-disc pl-5 space-y-1">
                          {analysis.structuredReport.guidance.evidence.map(
                            (s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ),
                          )}
                        </ul>
                      </section>
                      <div className="mt-4 p-3 bg-muted rounded text-xs text-muted-foreground italic">
                        Disclaimer: This guidance is for awareness and
                        assistance only. Please contact official authorities for
                        legal action.
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              {/* Action Items Column */}
              <div className="space-y-6">
                <Card className="p-6 bg-red-500/5 border-red-200/20 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <h3 className="font-bold text-lg text-red-500">
                      Immediate Actions
                    </h3>
                  </div>
                  <ul className="space-y-4">
                    {analysis?.structuredReport?.guidance?.nextSteps?.map(
                      (step: string, idx: number) => (
                        <li key={idx} className="flex gap-3 items-start">
                          <CheckCircle2 className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                          <span className="text-sm font-medium leading-tight">
                            {step}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                </Card>

                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium text-center">
                    This report has been automatically formatted for submission
                    to cyber crime authorities.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
