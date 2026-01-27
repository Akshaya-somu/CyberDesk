import { Shield, AlertTriangle, Lock, Eye, ArrowRight, CheckCircle2, Sparkles, Loader2, ArrowLeft, Bot } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useGenerateReport } from "@/hooks/use-reports";

export default function IncidentResponse() {
  const [description, setDescription] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const generateReport = useGenerateReport();

  const handleAnalyze = async () => {
    if (!description.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await generateReport.mutateAsync(description);
      setAnalysis(result.structuredReport);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const phases = [
    {
      title: "Immediate Containment",
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-500/10",
      description: "Stop further damage immediately.",
      steps: [
        "Disconnect affected devices from the internet",
        "Avoid clicking additional suspicious links",
        "Log out of compromised accounts",
        "Block bank cards or payment methods if financial fraud is detected"
      ]
    },
    {
      title: "Account & System Security",
      icon: Lock,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      description: "Secure your accounts and devices.",
      steps: [
        "Change passwords for affected and linked accounts",
        "Enabling two-factor authentication (2FA)",
        "Checking recent login activity",
        "Updating security settings on platforms"
      ]
    },
    {
      title: "Evidence Preservation",
      icon: Eye,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      description: "Gather information for investigation.",
      steps: [
        "Take screenshots of suspicious messages or emails",
        "Save URLs, email headers, and timestamps",
        "Preserve transaction receipts or bank alerts",
        "Avoid deleting important messages"
      ]
    },
    {
      title: "Reporting & Recovery",
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-500/10",
      description: "Final steps for recovery and legal action.",
      steps: [
        "Submit the generated report to cyber crime portals",
        "Contact banks or service providers involved",
        "Monitor accounts for unusual activity",
        "Follow up on complaints and reset credentials"
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" /> Incident Response
          </h1>
          <p className="text-muted-foreground mt-2">Structured guidance to handle cyber incidents effectively.</p>
        </div>
        <Link href="/report/new">
          <Button variant="outline" className="font-semibold gap-2">
            File Formal Report
          </Button>
        </Link>
      </div>

      {!analysis && !isAnalyzing ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <Card className="p-8 shadow-xl border-primary/10 bg-card/50 backdrop-blur-sm">
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Analyze Incident for Guidance</h3>
              <p className="text-sm text-muted-foreground">
                Enter a brief description of what happened. We will provide specific next steps and precautions to take immediately.
              </p>
              <Textarea 
                placeholder="e.g., I received a call from someone claiming to be my bank and shared my OTP..."
                className="min-h-[150px] text-base leading-relaxed resize-none p-4 input-modern"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  size="lg" 
                  onClick={handleAnalyze}
                  className="btn-primary-glow font-bold"
                  disabled={!description.trim()}
                >
                  Analyze Incident <Sparkles className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {phases.map((phase, idx) => (
              <Card key={phase.title} className="h-full border-t-4 border-t-primary/20 opacity-70">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className={`${phase.bg} ${phase.color} p-3 rounded-xl`}>
                      <phase.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{phase.title}</CardTitle>
                      <p className="text-xs text-muted-foreground">{phase.description}</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </motion.div>
      ) : isAnalyzing ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <h2 className="text-2xl font-bold">Analyzing for Response Steps...</h2>
          <p className="text-muted-foreground">Determining immediate precautions and security actions.</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => { setAnalysis(null); setDescription(""); }}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-2xl font-bold">Incident Analysis Results</h2>
          </div>

          <Card className="p-8 border-l-4 border-l-orange-500 shadow-xl">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b">
              <Shield className="w-6 h-6 text-orange-500" />
              <div>
                <h3 className="text-xl font-bold">Recommended Precautions & Actions</h3>
                <p className="text-sm text-muted-foreground uppercase font-mono tracking-wider">Type: {analysis.incidentType}</p>
              </div>
            </div>

            {!analysis.guidance ? (
              <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  The incident type could not be clearly identified. Please provide more details or chat with our assistant for personalized help.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                <section className="bg-red-500/5 p-6 rounded-2xl border border-red-500/10">
                  <h4 className="font-bold text-red-600 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> Immediate Precautions
                  </h4>
                  <ul className="space-y-3">
                    {analysis.guidance.immediate.map((s: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm items-start">
                        <span className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">{i+1}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="bg-orange-500/5 p-6 rounded-2xl border border-orange-500/10">
                  <h4 className="font-bold text-orange-600 mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5" /> Security Actions
                  </h4>
                  <ul className="space-y-3">
                    {analysis.guidance.security.map((s: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm items-start">
                        <span className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">{i+1}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="bg-blue-500/5 p-6 rounded-2xl border border-blue-500/10">
                  <h4 className="font-bold text-blue-600 mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5" /> Evidence Preservation
                  </h4>
                  <ul className="space-y-3">
                    {analysis.guidance.evidence.map((s: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm items-start">
                        <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">{i+1}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="bg-green-500/5 p-6 rounded-2xl border border-green-500/10">
                  <h4 className="font-bold text-green-600 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Next Steps
                  </h4>
                  <ul className="space-y-3">
                    {analysis.guidance.nextSteps.map((s: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm items-start">
                        <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">{i+1}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <Link href="/chat">
                <Button className="gap-2">
                  <Bot className="w-4 h-4" /> Need more help? Chat with AI
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      )}
      
      <div className="text-center p-4 bg-orange-500/5 rounded-lg border border-orange-500/10 text-[11px] text-muted-foreground italic">
        Disclaimer: This Incident Response module provides structured assistance and precautions. It does NOT automatically file an FIR. Use the "New Report" module for formal reporting.
      </div>
    </div>
  );
}
