# Clara AI — Enterprise Candidate Intelligence & Screening Platform

**Clara AI** is an enterprise-grade recruiting co-pilot and applicant intelligence platform engineered to revolutionize top-of-funnel hiring. Combining deep AI reasoning with an Apple-inspired glassmorphic design system, Clara AI eliminates manual resume triage, extracts role-specific competencies, uncovers hidden candidate gaps, and enables side-by-side comparative decision making.

---

## 🌟 Key Capabilities & Features

### 1. 👥 Dual-Portal Architecture
* **Candidate Careers Portal**:
  * Clean, candidate-facing application experience.
  * Search, filter, and explore active openings by category (Engineering, Operations, Product, etc.).
  * Direct modal application workflow with real-time field validation (RFC-compliant email, sanitized phone, numeric age constraints) and `.docx` resume upload.
* **Recruiter Command Center**:
  * Unified workspace for talent acquisition teams, founders, and hiring managers.
  * Instant toggling between Candidate Portal and Recruiter Workspace.

### 2. ⚡ Top-of-Funnel AI Screening Engine
* **DOCX Document Ingestion**: Server-side parsing and structure extraction using Mammoth.
* **Evidence-Based Evaluation**:
  * **Match Score (0–100%)**: Quantitative score based strictly on explicit resume evidence against role criteria.
  * **Overall Fit Assessment**: Executive recruiter narrative synthesizing candidate strengths and seniority alignment.
  * **Strong Matches (✓)**: Concrete proof points extracted directly from candidate experience.
  * **Gaps & High-Yield Interview Questions**: Identifies missing qualifications and formulates exact interview questions for recruiters.
* **Multi-LLM Cascade**: High-speed inference using **Groq** (`qwen/qwen3.8-27b`, `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `groq/compound`) and **Google Gemini** with intelligent fallback.
* **Bias-Free Compliance**: Strict prompting guards against using age, gender, race, or other protected characteristics in scoring.

### 3. ⚖️ Side-by-Side Candidate Comparison Matrix
* Compare 2 or 3 shortlisted candidates for any open position simultaneously.
* Visual ranking ribbons (🏆 Top Match, 🥈 Runner Up, 🥉 Contender).
* Direct side-by-side alignment across Match Score, Overall Fit, Key Strengths, and Identified Risks.
* Executive recommendation summary to guide final interview selections.

### 4. 💼 Full Requisition & Job Opening Management
* **Create Requisitions**: Add custom openings with title, company, description, bulleted responsibilities, skills, and experience.
* **Edit Existing Openings**: Live modal editor to update role criteria with real-time field validation.
* **Delete Openings & Records**: Requisition removal with Apple-grade frosted confirmation dialogs.

### 5. 🎨 Apple-Grade Glassmorphic UI System
* **Frosted Glass Components**: `backdrop-blur-xl`, delicate border lighting, subtle glow effects, and modern typography.
* **Apple Select Picklists**: Replaced default browser select inputs with sleek rounded-2xl picklist controls featuring custom vector chevrons.
* **In-App Modal Confirmation**: Replaced dated browser `window.confirm()` and `alert()` popups with frosted confirmation dialogs and floating toast notifications.
* **Slide-Over Resume Inspector**: Read and inspect original candidate resumes in an embedded slide-out drawer without leaving the evaluation dashboard.
* **Export & Download**: Download original candidate resumes directly as `.docx` or formatted `.txt` files.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4, Custom Glassmorphism tokens, CSS Variables |
| **Database** | Serverless PostgreSQL ([Neon DB](https://neon.tech/)) via `postgres` client |
| **Document Parsing** | Mammoth (`.docx` AST extraction and text sanitization) |
| **AI / LLM Providers** | Groq (`qwen/qwen3.8-27b`, `openai/gpt-oss-120b`), Google Gemini, Grok |
| **Deployment** | Vercel Serverless Functions |

---

## 📂 Project Architecture

```
Clara-Ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── jobs/
│   │   │   │   └── route.ts       # GET, POST, PUT, DELETE for job openings (Neon DB)
│   │   │   └── screen/
│   │   │       └── route.ts       # DOCX parsing, LLM cascade, screening DB storage
│   │   ├── globals.css            # Apple design tokens, animations, glassmorphism
│   │   ├── layout.tsx             # Root layout with metadata and fonts
│   │   └── page.tsx               # Dual portal, Recruiter Workspace, Comparison Matrix
│   ├── data/
│   │   └── jobs.ts                # Default seed job requisitions
│   └── lib/
│       └── db.ts                  # Neon PostgreSQL connection & auto-migration schemas
├── .env.local                     # Environment configuration (Keys & DB URL)
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Priyanknandawat/ClaraAi-Demo.git
cd ClaraAi-Demo
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# AI Provider Keys (at least one is required for live AI evaluations)
GROQ_API_KEY=gsk_your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key

# PostgreSQL Connection (e.g. Neon DB, Supabase, or AWS RDS)
DATABASE_URL=postgresql://user:password@ep-aged-king-pooler.region.aws.neon.tech/neondb?sslmode=require
```

> **Note:** If `DATABASE_URL` is omitted, Clara AI gracefully falls back to browser `localStorage` state management, ensuring full offline or standalone functionality.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build

```bash
npm run build
npm run start
```

---

## 🔒 Security & Data Privacy

* **Strict Input Sanitization**: Form inputs are validated and stripped of non-printable Unicode characters.
* **Server-Side File Validation**: Enforces MIME types, file signature inspection, and 5MB size limits.
* **Credential Isolation**: API keys and database credentials remain strictly server-side.
* **Data Minimization**: Resume files are converted to structured evaluation criteria without transmitting unnecessary metadata to external APIs.

---

## 📄 License

This project is licensed under the MIT License. 
