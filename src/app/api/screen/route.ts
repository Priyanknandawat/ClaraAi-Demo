import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { jobOpenings } from "@/data/jobs";
import { sql, ensureTablesExist } from "@/lib/db";

function parseJsonSafely(text: string): any {
  if (!text) {
    throw new Error("Empty response content from AI provider");
  }

  // 1. Direct parse try first
  try {
    return JSON.parse(text);
  } catch {}

  // 2. Strip markdown code fences (```json ... ``` or ``` ... ```)
  let cleaned = text.trim();
  cleaned = cleaned.replace(/```(?:json)?([\s\S]*?)```/gi, "$1").trim();

  try {
    return JSON.parse(cleaned);
  } catch {}

  // 3. Precise balanced brace extractor
  const startIdx = cleaned.indexOf("{");
  if (startIdx !== -1) {
    let depth = 0;
    let inString = false;
    let escapeNext = false;
    let endIdx = -1;

    for (let i = startIdx; i < cleaned.length; i++) {
      const char = cleaned[i];

      if (escapeNext) {
        escapeNext = false;
        continue;
      }

      if (char === "\\") {
        escapeNext = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === "{") {
          depth++;
        } else if (char === "}") {
          depth--;
          if (depth === 0) {
            endIdx = i;
            break;
          }
        }
      }
    }

    if (endIdx !== -1) {
      const jsonCandidate = cleaned.slice(startIdx, endIdx + 1);
      try {
        return JSON.parse(jsonCandidate);
      } catch {
        // Attempt minor repairs: remove trailing commas before } or ]
        const repaired = jsonCandidate
          .replace(/,\s*([}\]])/g, "$1")
          .replace(/[\u0000-\u001F]+/g, (match) => (match.includes("\n") ? "\n" : " "));
        try {
          return JSON.parse(repaired);
        } catch {}
      }
    }
  }

  // 4. Fallback: slice from first { to last }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
    const repaired = candidate
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/[\u0000-\u001F]+/g, (match) => (match.includes("\n") ? "\n" : " "));
    return JSON.parse(repaired);
  }

  return JSON.parse(cleaned);
}

// Abstraction for Gemini API calling
async function callGeminiAPI(
  apiKey: string,
  resumeText: string,
  jobDescription: string,
  candidateDetails: any
): Promise<any> {
  const modelName = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const systemPrompt = `You are an expert technical recruiter evaluating a candidate for a specific job opening.
Your job is to compare the candidate's resume against the job description requirements and provide an objective, evidence-based evaluation.

RULES:
1. Evaluate ONLY based on the provided resume and job description. Do not invent any credentials, experience, or qualifications.
2. Distinguish explicit evidence from assumptions. Identify uncertainty where information is missing or unclear.
3. Never treat missing information as proof that the candidate lacks a skill. Simply identify it as a gap or area of uncertainty.
4. STRICT COMPLIANCE: Do NOT use protected or sensitive personal characteristics (such as Age, Gender, Race, Religion, Disability, Marital Status) for candidate scoring or evaluation.
5. Avoid overly enthusiastic or marketing-like language. Be objective, calm, professional, and recruiter-focused.
6. Favor concrete evidence-based statements over generic assertions.
7. Return a structured JSON response with match_score (0-100), overall_fit (string), strong_matches (array of strings), and gaps_and_questions (array of {gap, question} objects).`;

  const userPrompt = `Candidate Name: ${candidateDetails.name}
Candidate Location: ${candidateDetails.currentLocation}
Candidate Email: ${candidateDetails.email}

Job Description:
${jobDescription}

Candidate Resume Text:
${resumeText}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n---\n\n${userPrompt}` }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawContent) {
    throw new Error("Empty response from Gemini API");
  }

  return parseJsonSafely(rawContent);
}

// Abstraction for Groq API calling (groq.com)
async function callGroqAPI(
  apiKey: string,
  resumeText: string,
  jobDescription: string,
  candidateDetails: any
): Promise<any> {
  // Dynamically query available models for this specific Groq key
  let candidateModels = [
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant",
    "llama3-70b-8192",
    "llama3-8b-8192",
    "gemma2-9b-it",
    "mixtral-8x7b-32768"
  ];

  try {
    const listRes = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "User-Agent": "Mozilla/5.0",
      },
    });
    if (listRes.ok) {
      const data = await listRes.json();
      const availableList: { id: string }[] = data.data || [];
      const availableIds = availableList.map((m) => m.id);
      
      const matched = candidateModels.filter((m) => availableIds.includes(m));
      if (matched.length > 0) {
        candidateModels = matched;
      } else if (availableIds.length > 0) {
        const chatModels = availableIds.filter(
          (id) => !id.includes("whisper") && !id.includes("guard") && !id.includes("embed")
        );
        if (chatModels.length > 0) {
          candidateModels = chatModels;
        }
      }
    }
  } catch (e) {
    console.warn("Could not query Groq models dynamically, will try candidate models", e);
  }

  const url = "https://api.groq.com/openai/v1/chat/completions";

  const systemPrompt = `You are an expert recruiter evaluating a candidate against a job description.
Evaluate only based on the provided resume and job description. Do not invent credentials.
Do not use age, gender, race, or other protected characteristics in scoring.
You MUST output valid JSON and nothing else.

Required JSON Structure:
{
  "match_score": 75,
  "overall_fit": "Concise summary of candidate fit...",
  "strong_matches": ["Key strength 1", "Key strength 2"],
  "gaps_and_questions": [
    {
      "gap": "Description of gap or missing information",
      "question": "Specific interview question to ask candidate"
    }
  ]
}`;

  const userPrompt = `Candidate Name: ${candidateDetails.name}
Candidate Location: ${candidateDetails.currentLocation}
Candidate Email: ${candidateDetails.email}

Job Description:
${jobDescription}

Candidate Resume:
${resumeText}`;

  let lastError: Error | null = null;

  for (const modelName of candidateModels) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 404) {
          // Model not found for this account/tier, try next model in cascade
          console.warn(`Groq model ${modelName} returned 404, trying next...`);
          lastError = new Error(`Groq API error: ${response.status} - ${errorText}`);
          continue;
        }
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content;
      if (!rawContent) {
        throw new Error("Empty response from Groq API");
      }

      const parsed = parseJsonSafely(rawContent);

      if (
        typeof parsed.match_score !== "number" ||
        typeof parsed.overall_fit !== "string" ||
        !Array.isArray(parsed.strong_matches) ||
        !Array.isArray(parsed.gaps_and_questions)
      ) {
        throw new Error("Groq returned an incomplete JSON structure");
      }

      return parsed;
    } catch (err: any) {
      if (err.message?.includes("404")) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("No compatible Groq model available for this API key.");
}

// Abstraction for Grok API calling
async function callGrokAPI(
  apiKey: string,
  resumeText: string,
  jobDescription: string,
  candidateDetails: any
): Promise<any> {
  const modelName = "grok-beta";
  const url = "https://api.x.ai/v1/chat/completions";

  const systemPrompt = `You are an expert technical recruiter evaluating a candidate for a specific job opening.
Compare the resume against the job description requirements. Provide an objective evaluation.
Return valid JSON only matching the schema:
{
  "match_score": 85,
  "overall_fit": "string",
  "strong_matches": ["string"],
  "gaps_and_questions": [{"gap": "string", "question": "string"}]
}`;

  const userPrompt = `Candidate Name: ${candidateDetails.name}
Candidate Location: ${candidateDetails.currentLocation}
Candidate Email: ${candidateDetails.email}

Job Description:
${jobDescription}

Candidate Resume Text:
${resumeText}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Grok API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error("Empty response from Grok API");
  }

  return parseJsonSafely(rawContent);
}

// Simulated / Fallback scoring
function getMockScreeningResult(
  jobId: string,
  candidateName: string,
  resumeText: string
): any {
  const hasExcel = /excel|sheet/i.test(resumeText);
  const hasMarketing = /marketing|social|content/i.test(resumeText);
  
  if (jobId === "opening-a") {
    return {
      match_score: hasExcel ? 82 : 68,
      overall_fit: `The candidate ${candidateName} shows decent alignment for the Founders Office Associate position.`,
      strong_matches: [`Has relevant consulting background.`],
      gaps_and_questions: [{ gap: "Planning details missing.", question: "How do you manage risks?" }],
      isMock: true
    };
  } else {
    return {
      match_score: hasMarketing ? 85 : 65,
      overall_fit: `The candidate ${candidateName} demonstrates a strong background in content strategy and team leadership.`,
      strong_matches: [`5+ years experience.`],
      gaps_and_questions: [{ gap: "SEO experience unclear.", question: "What SEO strategies do you use?" }],
      isMock: true
    };
  }
}

function cleanInputString(str: string): string {
  if (!str) return "";
  return str.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, "").trim();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawName = formData.get("name") as string | null;
    const rawEmail = formData.get("email") as string | null;
    const rawPhone = formData.get("phone") as string | null;
    const rawAddress = formData.get("address") as string | null;
    const rawAge = formData.get("age") as string | null;
    const rawCurrentLocation = formData.get("currentLocation") as string | null;
    const jobOpeningId = formData.get("jobOpeningId") as string | null;

    const name = cleanInputString(rawName || "");
    const email = cleanInputString(rawEmail || "");
    const phone = cleanInputString(rawPhone || "");
    const address = cleanInputString(rawAddress || "");
    const age = cleanInputString(rawAge || "");
    const currentLocation = cleanInputString(rawCurrentLocation || "");

    if (!file || !name || !email || !jobOpeningId) {
      return NextResponse.json({ error: "Missing required screening parameters." }, { status: 400 });
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "docx") {
      return NextResponse.json({ error: "Invalid file type. Only .docx files are accepted." }, { status: 400 });
    }

    let resumeText = "";
    let resumeHtml = "";
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const [textResult, htmlResult] = await Promise.all([
        mammoth.extractRawText({ buffer }),
        mammoth.convertToHtml({ buffer })
      ]);

      resumeText = textResult.value ? cleanInputString(textResult.value) : "";
      resumeHtml = htmlResult.value || "";

      if (!resumeText && !resumeHtml) {
        return NextResponse.json({ error: "The uploaded resume seems to be empty." }, { status: 400 });
      }
    } catch (parseError: any) {
      return NextResponse.json({ error: `Failed to parse DOCX file: ${parseError.message}` }, { status: 400 });
    }

    const job = jobOpenings.find((o) => o.id === jobOpeningId);
    if (!job) {
      return NextResponse.json({ error: "Selected job opening not found." }, { status: 400 });
    }

    const jobDescriptionFull = `
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}
Responsibilities: ${job.responsibilities.map((r) => `- ${r}`).join("\n")}
Skills: ${job.skills.map((s) => s.items.join(", ")).join("; ")}
`;

    const apiKey = req.headers.get("x-llm-api-key") || process.env.LLM_API_KEY || process.env.GROK_API_KEY || process.env.GROQ_API_KEY;

    if (!apiKey) {
      const mockResult = getMockScreeningResult(jobOpeningId, name, resumeText);
      const screeningId = `scr-${Date.now()}`;
      
      if (sql) {
        try {
          await ensureTablesExist();
          await sql`
            INSERT INTO screenings (id, candidate_name, candidate_email, candidate_phone, candidate_address, candidate_age, candidate_location, job_id, match_score, overall_fit, strong_matches, gaps_and_questions, warning, resume_text, resume_html)
            VALUES (${screeningId}, ${name}, ${email}, ${phone}, ${address}, ${Number(age) || 25}, ${currentLocation}, ${jobOpeningId}, ${mockResult.match_score}, ${mockResult.overall_fit}, ${mockResult.strong_matches || []}, ${JSON.stringify(mockResult.gaps_and_questions || [])}, ${"Running in simulated/mock mode because no LLM_API_KEY was supplied."}, ${resumeText}, ${resumeHtml})
          `;
        } catch (dbError) { console.error("DB Save failed", dbError); }
      }
      return NextResponse.json({ ...mockResult, id: screeningId, resumeText, resumeHtml });
    }

    try {
      let evaluation: any;
      if (apiKey.startsWith("gsk_")) {
        evaluation = await callGroqAPI(apiKey, resumeText, jobDescriptionFull, { name, email, currentLocation, age });
      } else if (apiKey.startsWith("xai-")) {
        evaluation = await callGrokAPI(apiKey, resumeText, jobDescriptionFull, { name, email, currentLocation, age });
      } else {
        evaluation = await callGeminiAPI(apiKey, resumeText, jobDescriptionFull, { name, email, currentLocation, age });
      }

      const screeningId = `scr-${Date.now()}`;
      if (sql) {
        try {
          await ensureTablesExist();
          await sql`
            INSERT INTO screenings (id, candidate_name, candidate_email, candidate_phone, candidate_address, candidate_age, candidate_location, job_id, match_score, overall_fit, strong_matches, gaps_and_questions, warning, resume_text, resume_html)
            VALUES (${screeningId}, ${name}, ${email}, ${phone}, ${address}, ${Number(age) || 25}, ${currentLocation}, ${jobOpeningId}, ${evaluation.match_score}, ${evaluation.overall_fit}, ${evaluation.strong_matches || []}, ${JSON.stringify(evaluation.gaps_and_questions || [])}, ${evaluation.warning || null}, ${resumeText}, ${resumeHtml})
          `;
        } catch (dbError) { console.error("DB Save failed", dbError); }
      }
      return NextResponse.json({ ...evaluation, id: screeningId, resumeText, resumeHtml });
    } catch (llmError: any) {
      const mockResult = getMockScreeningResult(jobOpeningId, name, resumeText);
      return NextResponse.json({ ...mockResult, resumeText, resumeHtml, warning: `LLM failed: ${llmError.message}` });
    }
  } catch (err: any) {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function GET() {
  if (sql) {
    try {
      await ensureTablesExist();
      const dbScreenings = await sql`SELECT * FROM screenings ORDER BY screened_at DESC`;
      const formatted = dbScreenings.map((s) => ({
        id: s.id,
        candidateName: s.candidate_name,
        candidateEmail: s.candidate_email,
        candidatePhone: s.candidate_phone,
        candidateAddress: s.candidate_address,
        candidateAge: s.candidate_age,
        candidateLocation: s.candidate_location,
        jobId: s.job_id,
        matchScore: s.match_score,
        overallFit: s.overall_fit,
        strongMatches: s.strong_matches || [],
        gapsAndQuestions: typeof s.gaps_and_questions === "string" ? JSON.parse(s.gaps_and_questions) : s.gaps_and_questions,
        screenedAt: s.screened_at,
        warning: s.warning || undefined,
        resumeText: s.resume_text || undefined,
        resumeHtml: s.resume_html || undefined,
      }));
      return NextResponse.json(formatted);
    } catch (e) {
      console.error("Failed to fetch screenings:", e);
      return NextResponse.json([]);
    }
  }
  return NextResponse.json([]);
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (sql && id) await sql`DELETE FROM screenings WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: "Delete failed" }, { status: 500 }); }
}
