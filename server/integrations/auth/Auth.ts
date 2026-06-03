import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { hash, compare } from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { authStorage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);

  const sessionStore = new pgStore({
    conString: `${process.env.DATABASE_URL}${
      process.env.DATABASE_URL?.includes("?") ? "&" : "?"
    }sslmode=require`,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: sessionTtl,
    },
  });
}

interface LocalUser {
  id?: string;
  username?: string;
  passwordHash?: string;
  displayName?: string;
  email?: string;
}

async function ensureAdmin() {
  const existing = await authStorage.getUserByUsername("admin");

  if (!existing) {
    const passwordHash = await hash("admin123", 10);

    await authStorage.upsertUser({
      id: uuidv4(),
      username: "admin",
      passwordHash,
      displayName: "Administrator",
      email: "admin@local",
    } as LocalUser);
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // ensure demo admin exists
  await ensureAdmin();
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session && (req.session as any).user) return next();
  res.status(401).json({ message: "Unauthorized" });
};

export async function loginHandler(req: any, res: any) {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const user = await authStorage.getUserByUsername(username);

    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await compare(password, user.passwordHash);

    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const displayName =
      user.firstName || user.lastName
        ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
        : user.email || user.username || "";

    (req.session as any).user = {
      id: user.id,
      username: user.username,
      displayName,
    };

    res.json({
      id: user.id,
      username: user.username,
      displayName,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
}

export function logoutHandler(req: any, res: any) {
  req.session?.destroy((err: any) => {
    if (err) {
      console.error("Session destroy error:", err);
    }

    res.json({ ok: true });
  });
}

export function getUserHandler(req: any, res: any) {
  const user = (req.session as any)?.user;

  if (!user) {
    return res.json(null);
  }

  res.json(user);
}
