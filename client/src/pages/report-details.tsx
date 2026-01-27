import { useRoute } from "wouter";
import { useReport } from "@/hooks/use-reports";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, ShieldCheck, Clock, FileText } from "lucide-react";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function ReportDetails() {
  const [, params] = useRoute("/report/:id");
  const id = params ? parseInt(params.id) : 0;
  const { data: report, isLoading } = useReport(id);

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
              {structured.generatedReportText && (
                <section>
                  <h3 className="text-sm font-bold uppercase text-muted-foreground mb-3">Official Report format</h3>
                  <div className="text-sm font-mono whitespace-pre-wrap p-6 bg-muted/30 rounded-lg border border-border/50 shadow-sm text-foreground/90">
                    {structured.generatedReportText}
                  </div>
                </section>
              )}
            </div>
          </Card>

          {structured.guidance && (
            <Card className="p-6 border-l-4 border-l-orange-500 shadow-sm">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" /> Response Guidance
              </h3>
              <div className="grid md:grid-cols-2 gap-8">
                <section>
                  <h4 className="text-sm font-bold uppercase text-orange-600 mb-2">Immediate Actions</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {structured.guidance.immediate.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </section>
                <section>
                  <h4 className="text-sm font-bold uppercase text-orange-600 mb-2">Security Steps</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {structured.guidance.security.map((s: string, i: number) => <li key={i}>{s}</li>)}
                  </ul>
                </section>
              </div>
              <div className="mt-6 p-3 bg-muted/50 rounded text-xs text-muted-foreground italic">
                Disclaimer: This guidance is for awareness and assistance only.
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-card border-l-4 border-l-green-500 shadow-sm">
            <h3 className="font-bold text-lg mb-4">Recommended Actions</h3>
            <ul className="space-y-4">
              {structured.nextSteps.map((step: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    {i + 1}
                  </div>
                  <span className="leading-snug pt-1">{step}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 bg-secondary text-secondary-foreground">
            <h3 className="font-bold mb-2">Need Further Help?</h3>
            <p className="text-sm text-secondary-foreground/80 mb-4">
              Our AI assistant can explain technical terms or guide you through the reporting process.
            </p>
            <Link href="/chat">
              <Button variant="secondary" className="w-full bg-white text-secondary hover:bg-white/90">
                Chat with Assistant
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
