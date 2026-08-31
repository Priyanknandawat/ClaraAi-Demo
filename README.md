# ClaraScreen

ClaraScreen is an AI-assisted recruiting workflow for recruiters who need a cleaner, faster, and more structured way to evaluate candidates against open roles.

The product combines a polished candidate dashboard, a resume upload and screening workflow, and an evidence-based AI review that highlights fit, gaps, and recruiter follow-up questions.

---

## Product Overview

ClaraScreen helps recruiters:
- evaluate a candidate against a target job opening
- upload a DOCX resume and extract the raw text
- compare the resume against role requirements
- review a structured score, fit narrative, strengths, and interview gaps
- browse prior screenings from a centralized dashboard
- open the original resume in a side panel for quick review without leaving the reporting screen

The experience is designed to feel professional and operational rather than chat-based or overly promotional.

---

## Current UX Flow

The application includes:
- a landing screen with a strong entry point for recruiters
- a dashboard overview for recent evaluations and active roles
- a screening workflow with candidate details, resume upload, and job selection
- a review screen before the AI evaluation is triggered
- detailed screening results with match score, profile summary, strengths, and interview questions
- a slide-out resume panel that behaves like a document preview without breaking context

---

## Tech Stack

- Next.js App Router
- TypeScript
- React 19
- Tailwind CSS v4
- Mammoth for DOCX parsing
- PostgreSQL support via the `postgres` library
- LLM integrations for provider-based screening with graceful fallback to simulated results

---

## Architecture

The app is structured around a few clear layers:

### Frontend
The main app is rendered in [src/app/page.tsx](src/app/page.tsx). It handles:
- landing page
- dashboard
- screenings list and detail view
- candidate screening form
- job opening management
- local browser persistence fallback

### API Routes
The screening flow is handled by [src/app/api/screen/route.ts](src/app/api/screen/route.ts), which performs:
- file validation
- DOCX extraction
- job lookup
- LLM call selection
- fallback mock generation
- database insert if configured

The job endpoints are served from [src/app/api/jobs/route.ts](src/app/api/jobs/route.ts).

### Data Layer
Database connection and schema creation live in [src/lib/db.ts](src/lib/db.ts). The code creates `jobs` and `screenings` tables when available and is safe to run even when no database connection is configured.

---

## How Screening Works

### 1. Resume Upload
Recruiters upload a `.docx` resume through the candidate screening form.

### 2. DOCX Extraction
The uploaded file is parsed on the server using Mammoth. Raw text is extracted and cleaned before being sent to the LLM.

### 3. Job Matching
The selected role is loaded from the job list and assembled with responsibilities, required skills, and experience criteria.

### 4. AI Evaluation
The backend selects the active LLM provider based on the API key format and calls the relevant provider. The evaluation includes:
- `match_score`
- `overall_fit`
- `strong_matches`
- `gaps_and_questions`

### 5. Dashboard Persistence
Results are added to the UI and stored in the browser local state. If a database is available, the same results are also saved to PostgreSQL.

### 6. Fallback Mode
If no API key is configured or the LLM call fails, the app returns a high-quality mock screening result so the workflow remains usable.

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
LLM_API_KEY=your_api_key_here
DATABASE_URL=postgresql://user:password@host:5432/db_name
```

Notes:
- `LLM_API_KEY` is used for live AI evaluation.
- `DATABASE_URL` is optional.
- If `DATABASE_URL` is not set, the app continues to work with local browser state.

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Run the app locally

```bash
npm run dev
```

Open http://localhost:3000 to use the app.

### 3. Production build

```bash
npm run build
npm run start
```

---

## Deployment on Vercel

For production deployment:
1. Push this repository to GitHub.
2. Import the project into Vercel.
3. Add the environment variables:
   - `LLM_API_KEY`
   - optionally `DATABASE_URL`
4. Deploy the project.

Vercel will pick up the Next.js app automatically.

---

## Security Notes

The current app is suitable for a demo or internal tool workflow, but production hardening would be recommended for real-world recruiting data.

Current safeguards in the code:
- form inputs are sanitized before use
- the server validates file type and content requirements
- LLM inputs are generated server-side
- DB writes are guarded behind an optional connection
- the app does not write secrets directly into the codebase

Recommended production hardening:
- enforce file size limits and document scan checks
- add rate limiting to screening requests
- avoid storing full resume text when not needed
- use short-lived access tokens for any production API auth
- add audit logging and retention rules for candidate records
- encrypt or minimize PII stored in the database

---

## Current known trade-offs

- only `.docx` resumes are accepted in the current workflow
- browser localStorage is used as a fallback for demo and offline scenarios
- the app uses simulated LLM fallback behavior so the workflow remains operable without a configured key
- candidate data storage is lightweight and intentionally simple for this version

---

## Future Improvements

Possible next steps include:
- PDF resume parsing support
- stronger candidate record retention and archival
- recruiter authentication and role-based access
- DB-backed job and screening audit trails
- better analytics and candidate comparison views
- export to CSV or PDF reports for interview packs

---

## Summary

ClaraScreen is a recruiter-first AI screening assistant that focuses on structured evaluations and practical hiring decisions. It is optimized for a fast internal workflow and is already positioned well for Vercel deployment, while still requiring production security hardening before handling large-scale personal data. 
