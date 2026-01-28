import { useRoute } from "wouter";
import { useReport } from "@/hooks/use-reports";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, ShieldCheck, Clock, FileText, AlertCircle, Lock, Eye, CheckCircle2, Bot } from "lucide-react";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";

export default function ReportDetails() {
  const [, params] = useRoute("/report/:id");
  const id = params ? parseInt(params.id) : 0;
  const { data: report, isLoading } = useReport(id);
  const [activeTab, setActiveTab] = useState<"report" | "response">("report");

  useEffect(() => {
    const structured = report?.structuredReport as any;
    if (structured?.guidance) {
      setActiveTab("response");
    }
  }, [report?.structuredReport]);

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

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
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
              <Clock className="w-3.5 h-3.5" /> {format(new Date(report.createdAt!), "PPP p")}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> ID: #{report.id}
            </span>
          </div>
        </div>
        <div className="ml-auto flex gap-3">
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print Report
          </Button>
        </div>
      </div>

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

      {activeTab === "report" ? (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-8 shadow-sm border-t-4 border-t-primary">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-border/50">
                <div>
                  <h2 className="text-xl font-bold font-display uppercase tracking-wider text-primary">Incident Report (FIR)</h2>
                  <p className="text-sm text-muted-foreground mt-1">Dynamically Generated Official Document</p>
                </div>
                <Badge variant="outline" className="px-3 py-1 text-sm font-mono">
                  {structured.incidentType}
                </Badge>
              </div>

              <div className="space-y-8">
                    {structured.description && (
                      <section>
                        <h3 className="text-sm font-bold uppercase text-muted-foreground mb-3">Official Report format</h3>
                        <div className="text-sm font-mono whitespace-pre-wrap p-6 bg-muted/30 rounded-lg border border-border/50 shadow-sm text-foreground/90">
                          {structured.description}
                        </div>
                      </section>
                    )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-secondary text-secondary-foreground">
              <h3 className="font-bold mb-2">Next Steps</h3>
              <p className="text-sm text-secondary-foreground/80 mb-4">
                Submit this report to your local police station or the National Cyber Crime Portal.
              </p>
              <Link href="/chat">
                <Button variant="secondary" className="w-full bg-white text-secondary hover:bg-white/90">
                  Help me with filing
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {!guidance && (
              <Card className="p-6 border-l-4 border-l-blue-500 shadow-sm bg-blue-50/50">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-500" /> Guidance Note
                </h3>
                <p className="text-sm text-muted-foreground">
                  The incident type could not be clearly identified from your description. 
                  Please provide more specific details about the incident in a new report to receive tailored response guidance.
                </p>
              </Card>
            )}

            {guidance && (
              <Card className="p-6 border-l-4 border-l-orange-500 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" /> Incident-Specific Guidance
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Based on the detected incident of <strong>{structured.incidentType}</strong>, here are the structured precautions and actions you should take:
                </p>
                
                <div className="grid gap-8">
                  {guidance.immediate && (
                    <section className="bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                      <h4 className="text-sm font-bold uppercase text-red-600 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Immediate Precautions (Containment)
                      </h4>
                      <ul className="list-disc pl-5 space-y-2 text-sm text-foreground/80">
                        {guidance.immediate.map((s: string, i: number) => <li key={i}>{s}</li>)}
                      </ul>
                    </section>
                  )}

                  {guidance.security && (
                    <section className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/10">
                      <h4 className="text-sm font-bold uppercase text-orange-600 mb-3 flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Security Actions
                      </h4>
                      <ul className="list-disc pl-5 space-y-2 text-sm text-foreground/80">
                        {guidance.security.map((s: string, i: number) => <li key={i}>{s}</li>)}
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
                          {guidance.evidence.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </section>
                    )}

                    {guidance.nextSteps && (
                      <section className="bg-green-500/5 p-4 rounded-xl border border-green-500/10">
                        <h4 className="text-sm font-bold uppercase text-green-600 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Recovery & Next Steps
                        </h4>
                        <ul className="list-disc pl-5 space-y-2 text-sm text-foreground/80">
                          {guidance.nextSteps.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </section>
                    )}
                  </div>
                </div>

                <div className="mt-8 p-4 bg-muted/50 rounded-xl text-xs text-muted-foreground italic flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                  <span>Disclaimer: This guidance is for awareness and immediate assistance only. Always follow official advice from authorized agencies.</span>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-card border-l-4 border-l-primary shadow-sm">
              <h3 className="font-bold text-lg mb-4">Why this matters?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Structured response helps reduce further loss and ensures that digital evidence is preserved for investigation.
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
