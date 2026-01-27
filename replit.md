# CyberDesk

## Overview

CyberDesk is an AI-powered cybercrime incident reporting platform that helps non-technical victims transform unstructured incident descriptions into formal, FIR-style (First Information Report) security reports. The platform uses Natural Language Processing and Generative AI to extract incident details, categorize cybercrime types (phishing, financial fraud, identity theft, etc.), and provide immediate actionable guidance for securing accounts and preserving evidence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **Animations**: Framer Motion for page transitions and UI animations
- **Build Tool**: Vite with path aliases (@/, @shared/, @assets/)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Style**: RESTful endpoints under /api prefix
- **Authentication**: Replit Auth with OpenID Connect, Passport.js, and session-based auth stored in PostgreSQL
- **AI Integration**: OpenAI API (via Replit AI Integrations) for report generation and chat assistance

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: shared/schema.ts with models in shared/models/
- **Migrations**: Drizzle Kit with migrations output to ./migrations

### Key Data Models
- **Users**: Authentication and profile data (required for Replit Auth)
- **Sessions**: Session storage for auth persistence
- **Reports**: Cybercrime incident reports with structured JSON data
- **Conversations/Messages**: Chat history for AI assistant

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components including shadcn/ui
    pages/        # Route pages (dashboard, new-report, chat, etc.)
    hooks/        # React Query hooks for data fetching
    lib/          # Utilities and query client
server/           # Express backend
  replit_integrations/  # Modular integrations (auth, chat, audio, image)
  routes.ts       # API route definitions
  storage.ts      # Database access layer
shared/           # Shared types and schemas
  schema.ts       # Drizzle database schema
  routes.ts       # API contract definitions with Zod
  models/         # Auth and chat model definitions
```

### Build & Development
- **Dev**: `npm run dev` runs tsx for hot-reloading
- **Build**: Custom build script using esbuild (server) and Vite (client)
- **Production**: Server bundles dependencies for faster cold starts

## External Dependencies

### AI Services
- **OpenAI API**: Used via Replit AI Integrations for:
  - Report generation (NLP extraction and FIR formatting)
  - Chat assistant for cybersecurity guidance
  - Voice transcription and text-to-speech capabilities
- Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Database
- **PostgreSQL**: Primary data store
- Environment variable: `DATABASE_URL`
- Session storage via `connect-pg-simple`

### Authentication
- **Replit Auth**: OpenID Connect provider
- Environment variables: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`

### Audio Processing
- **FFmpeg**: Used server-side for audio format conversion (WebM to WAV for transcription)
- AudioWorklet API on client for real-time audio playback

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `openai`: AI API client
- `passport` / `openid-client`: Authentication
- `express-session` / `connect-pg-simple`: Session management
- `zod`: Runtime type validation
- `@tanstack/react-query`: Client-side data fetching
- `framer-motion`: Animations
- `date-fns`: Date formatting