import { Shield, AlertTriangle, Lock, Eye, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function IncidentResponse() {
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
          <Button size="lg" className="btn-primary-glow font-semibold gap-2">
            Start New Report
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {phases.map((phase, idx) => (
          <motion.div
            key={phase.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
          >
            <Card className="h-full overflow-hidden border-t-4 border-t-primary/20">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <div className={`${phase.bg} ${phase.color} p-3 rounded-xl`}>
                    <phase.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="mb-2">Phase {idx + 1}</Badge>
                    </div>
                    <CardTitle className="text-xl">{phase.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{phase.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {phase.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm items-start">
                      <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                        {i + 1}
                      </div>
                      <span className="text-foreground/80 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="p-6 bg-muted/30 border-dashed">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="bg-primary/10 p-4 rounded-full">
            <AlertTriangle className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-bold mb-1">Did you know?</h3>
            <p className="text-sm text-muted-foreground">
              Taking the right steps in the first hour of an incident can reduce losses by up to 80%. 
              Always prioritize containment over investigation.
            </p>
          </div>
          <Link href="/chat">
            <Button variant="outline" className="gap-2">
              Get Personal Guidance <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </Card>

      <div className="text-center p-4 bg-orange-500/5 rounded-lg border border-orange-500/10 text-[11px] text-muted-foreground italic">
        Disclaimer: This Incident Response module is for educational and immediate assistance purposes. Always follow official advice from law enforcement and financial institutions.
      </div>
    </div>
  );
}
