import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Lock, FileText, ChevronRight, CheckCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <span className="font-display font-bold text-xl tracking-tight">CyberDesk</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/api/login">
              <Button variant="ghost" className="font-medium">Sign In</Button>
            </a>
            <a href="/api/login">
              <Button className="btn-primary-glow font-semibold">Get Started</Button>
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
            Victim of cyber crime? CyberDesk uses advanced AI to transform your incident description into formal FIR-ready reports and provides immediate actionable guidance.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/api/login">
              <Button size="lg" className="h-14 px-8 text-lg btn-primary-glow font-bold w-full sm:w-auto">
                Start Free Report <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto bg-background/50 backdrop-blur-sm">
              Learn How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-card/30 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold">Instant FIR Generation</h3>
              <p className="text-muted-foreground">
                Just describe what happened naturally. Our AI extracts key details and formats them into official legal report structures instantly.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-bold">Actionable Guidance</h3>
              <p className="text-muted-foreground">
                Don't know what to do next? Get a prioritized checklist of immediate actions to secure your accounts and finances.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-bold">24/7 AI Assistant</h3>
              <p className="text-muted-foreground">
                Have questions about technical terms or security best practices? Chat with our specialized security AI anytime.
              </p>
            </div>
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
            © 2024 CyberDesk Security Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
