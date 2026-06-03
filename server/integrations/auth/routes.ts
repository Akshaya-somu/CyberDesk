import type { Express } from "express";
import { authStorage } from "./storage";
import {
  isAuthenticated,
  loginHandler,
  logoutHandler,
  getUserHandler,
} from "./Auth";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Auth endpoints for demo local auth
  app.post("/api/login", loginHandler);
  app.post("/api/logout", logoutHandler);
  // Also support GET logout for compatibility with client redirects
  app.get("/api/logout", logoutHandler);
  app.get("/api/auth/user", getUserHandler);
}
