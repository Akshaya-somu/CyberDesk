import { Button } from "@/components/ui/button";
import { Shield, Home } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4">
        <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
          <Shield className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h1 className="text-6xl font-display font-bold text-primary mb-2">404</h1>
          <h2 className="text-2xl font-bold text-foreground mb-3">Page Not Found</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            The page you're looking for doesn't exist. It may have been moved or the link is incorrect.
          </p>
        </div>
        <Link href="/">
          <Button size="lg" className="btn-primary-glow gap-2">
            <Home className="w-4 h-4" /> Go Back Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
