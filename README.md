# 🛡️ CyberDesk

## 🚀 Overview

CyberDesk is an AI-powered cybercrime incident reporting and response platform designed to help users report cybercrime incidents in a simple and structured manner.

The platform transforms unstructured incident descriptions into formal FIR-style cybercrime reports, identifies cybercrime categories, generates security recommendations, and provides immediate response guidance. It helps victims of phishing attacks, online fraud, account hacking, identity theft, cyberstalking, and social media scams take the right actions quickly.

CyberDesk bridges the gap between non-technical users and cybersecurity processes by simplifying incident reporting and providing AI-assisted guidance.

---

## ✨ Features

### 🤖 AI-Powered Incident Analysis

- Converts user incident descriptions into structured cybercrime reports.
- Identifies cybercrime categories automatically.
- Generates severity assessments.
- Provides intelligent security recommendations.
- Extracts relevant evidence details.

### 📄 FIR Report Generation

- Generates formal FIR-style cybercrime reports.
- Creates structured complaint documents.
- Supports PDF report downloads.
- Maintains a professional reporting format.

### 🚨 Incident Response Guidance

- Immediate mitigation steps.
- Security recommendations.
- Evidence preservation guidance.
- Recovery and prevention suggestions.

### 💬 Cyber Assistant

- AI-powered cybersecurity assistant.
- Answers cybersecurity-related queries.
- Provides awareness and safety recommendations.
- Helps users understand cyber threats and best practices.

### 🔐 User Authentication

- Secure username and password login.
- Session-based authentication.
- Persistent login sessions using PostgreSQL.

### 📂 Report Management

- Create and manage incident reports.
- View previously generated reports.
- Download reports as PDF documents.

---

## 🛠️ Technology Stack

### 🎨 Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Framer Motion
- TanStack React Query

### ⚙️ Backend

- Node.js
- Express.js
- TypeScript

### 🗄️ Database

- PostgreSQL
- Drizzle ORM

### 🧠 AI & NLP

- Google Gemini API
- Natural Language Processing (NLP)
- AI-powered Incident Analysis
- Cybersecurity Assistance

---

## 📁 Project Structure

```text
client/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── lib/
│
server/
│
├── integrations/
│   ├── auth/
│   ├── chat/
│   ├── audio/
│   └── image/
│
├── routes.ts
├── db.ts
└── storage.ts
│
shared/
│
├── schema.ts
├── models/
└── routes.ts
```

---

## 🗃️ Database Models

### 👤 Users

Stores user authentication and profile information.

### 📝 Reports

Stores generated cybercrime reports and analysis results.

### 💭 Conversations

Stores chatbot conversation sessions.

### 📨 Messages

Stores messages exchanged between users and the cyber assistant.

### 🔑 Sessions

Maintains authenticated user sessions.

---

## 🔧 Environment Variables

Create a `.env` file and configure the following:

```env
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
```

---

## ⚡ Installation

### 📥 Clone Repository

```bash
git clone https://github.com/Akshaya-somu/CyberDesk.git
cd CyberDesk
```

### 📦 Install Dependencies

```bash
npm install
```

### 🔧 Configure Environment Variables

Create a `.env` file:

```env
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
```

### 🗄️ Setup Database

```bash
npm run db:push
```

### ▶️ Start Development Server

```bash
npm run dev
```

---

## 🌟 Core Workflow

1. User submits cybercrime incident details.
2. AI analyzes the incident.
3. CyberDesk identifies the cybercrime category.
4. Structured FIR report is generated.
5. Security recommendations are provided.
6. Incident response guidance is displayed.
7. User downloads the FIR report as PDF.

---

## ☁️ Deployment

CyberDesk is deployed using:

- 🚀 Render Web Service
- 🗄️ Render PostgreSQL Database
- 🔄 GitHub Continuous Deployment

### Live Demo

🌐 https://cyberdesk-s68d.onrender.com

---

## 🔮 Future Enhancements

- 🤖 Enhanced Gemini-powered Cyber Assistant
- 🌍 Multi-language support
- 📊 Advanced analytics dashboard
- 📧 Email and SMS alert integration
- 🛡️ Threat intelligence integration
- 📱 Mobile-friendly experience

---

## 🎓 Academic Project

CyberDesk was developed as an academic project to leverage Artificial Intelligence and Cybersecurity technologies for simplifying cybercrime reporting, incident analysis, and user guidance.

---

## 👩‍💻 Developer

**Akshaya Somu**
B.Tech – Computer Science and Engineering
Shri Vishnu Engineering College for Women (SVECW)

GitHub: https://github.com/Akshaya-somu

---

## 📜 License

This project is intended for academic and educational purposes only.
