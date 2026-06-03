import { Button } from "@/components/ui/button";
import {
  Shield,
  Lock,
  FileText,
  ChevronRight,
  CheckCircle,
} from "lucide-react";

export default function LandingPage() {
  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="font-display font-bold text-xl tracking-tight">
              CyberDesk
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/login">
              <Button variant="ghost" className="font-medium">
                Sign In
              </Button>
            </a>
            <a href="/login">
              <Button className="btn-primary-glow font-semibold">
                Get Started
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] opacity-30 animate-pulse" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[100px] opacity-30" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-8 border border-primary/20">
            <Lock className="w-4 h-4" /> Secure Incident Reporting Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-8 text-gradient pb-2">
            Turn Chaos Into <br /> Structured Security Reports
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Victim of cyber crime? CyberDesk uses advanced AI to transform your
            incident description into formal FIR-ready reports and provides
            immediate actionable guidance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/login">
              <Button
                size="lg"
                className="h-14 px-8 text-lg btn-primary-glow font-bold w-full sm:w-auto"
              >
                Start Free Report <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg w-full sm:w-auto bg-background/50 backdrop-blur-sm"
              onClick={scrollToFeatures}
            >
              Learn How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section
        id="features"
        className="py-24 bg-card/30 border-y border-border/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              How CyberDesk Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Three powerful modules to help you report, respond, and recover
              from cyber incidents.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold">Instant FIR Generation</h3>
              <p className="text-muted-foreground">
                Just describe what happened naturally. Our AI extracts key
                details and formats them into official legal report structures
                instantly.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-bold">Actionable Guidance</h3>
              <p className="text-muted-foreground">
                Don't know what to do next? Get a prioritized checklist of
                immediate actions to secure your accounts and finances.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold">24/7 AI Assistant</h3>
              <p className="text-muted-foreground">
                Have questions about technical terms or security best practices?
                Chat with our specialized security AI anytime.
              </p>
            </div>
          </div>

          {/* How it works steps */}
          <div className="mt-20 grid md:grid-cols-3 gap-8 text-center">
            {[
              {
                step: "1",
                title: "Describe the Incident",
                desc: "Write what happened in plain language — no technical knowledge required.",
              },
              {
                step: "2",
                title: "AI Structures the Report",
                desc: "Our AI categorizes the threat and generates a formal FIR complaint letter.",
              },
              {
                step: "3",
                title: "Get Guidance & File",
                desc: "Receive step-by-step precautions, then print and submit to authorities.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-background/60 border border-border/50"
              >
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-xl">
                  {item.step}
                </div>
                <h4 className="font-bold text-lg">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <a href="/login">
              <Button
                size="lg"
                className="h-14 px-10 text-lg btn-primary-glow font-bold"
              >
                Get Started for Free <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-lg">CyberDesk</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 CyberDesk Security Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
