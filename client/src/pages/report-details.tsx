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
                <p className="text-sm text-muted-foreground mt-1">Formatted for Official Submission</p>
              </div>
              <Badge variant="outline" className="px-3 py-1 text-sm font-mono">
                {structured.incidentType}
              </Badge>
            </div>

            <div className="space-y-8">
              <section>
                <h3 className="text-sm font-bold uppercase text-muted-foreground mb-3">Incident Description</h3>
                <div className="text-base leading-relaxed p-4 bg-muted/20 rounded-lg border border-border/50">
                  {structured.description}
                </div>
              </section>

              {structured.generatedReportText && (
                <section>
                  <h3 className="text-sm font-bold uppercase text-muted-foreground mb-3">Official Report Format</h3>
                  <div className="text-sm font-mono whitespace-pre-wrap p-6 bg-muted/30 rounded-lg border border-border/50 shadow-sm text-foreground/90">
                    {structured.generatedReportText}
                  </div>
                </section>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <section>
                  <h3 className="text-sm font-bold uppercase text-muted-foreground mb-2">Mode of Attack</h3>
                  <p className="font-medium">{structured.modeOfAttack}</p>
                </section>
                <section>
                  <h3 className="text-sm font-bold uppercase text-muted-foreground mb-2">Impact</h3>
                  <p className="font-medium">{structured.impact}</p>
                </section>
              </div>

              <section>
                <h3 className="text-sm font-bold uppercase text-muted-foreground mb-3">Suggested Legal Category</h3>
                <p className="font-medium bg-blue-500/5 text-blue-600 dark:text-blue-400 p-3 rounded border border-blue-500/20 inline-block">
                  {structured.suggestedCategory}
                </p>
              </section>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" /> Raw Input
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {report.rawDescription}
            </p>
          </Card>
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
