import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { jobOpenings } from "@/data/jobs";
import { sql, ensureTablesExist } from "@/lib/db";

// Abstraction for Gemini API calling
async function callGeminiAPI(
  apiKey: string,
  resumeText: string,
  jobDescription: string,
  candidateDetails: any
): Promise<any> {
  const modelName = "gemini-3.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const systemPrompt = `You are an expert technical recruiter evaluating a candidate for a specific job opening.
Your job is to compare the candidate's resume against the job description requirements and provide an objective, evidence-based evaluation.

RULES:
1. Evaluate ONLY based on the provided resume and job description. Do not invent any credentials, experience, or qualifications.
2. Distinguish explicit evidence from assumptions. Identify uncertainty where information is missing or unclear.
3. Never treat missing information as proof that the candidate lacks a skill. Simply identify it as a gap or area of uncertainty.
4. STRICT COMPLIANCE: Do NOT use protected or sensitive personal characteristics (such as Age, Gender, Race, Religion, Disability, Marital Status) for candidate scoring or evaluation. These details might be provided in the candidate info, but they must NOT influence the match score or candidate fit summary in any way.
5. Avoid overly enthusiastic or marketing-like language. Be objective, calm, professional, and recruiter-focused.
6. Favor concrete evidence-based statements (e.g., "Candidate has 3 years of Excel data analysis, which matches the data manipulation requirement") over generic assertions.
7. Return a structured JSON response matching the required schema.`;

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
          parts: [
            { text: `${systemPrompt}\n\n---\n\n${userPrompt}` }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            match_score: { type: "INTEGER" },
            overall_fit: { type: "STRING" },
            strong_matches: {
              type: "ARRAY",
              items: { type: "STRING" }
            },
            gaps_and_questions: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  gap: { type: "STRING" },
                  question: { type: "STRING" }
                },
                required: ["gap", "question"]
              }
            }
          },
          required: ["match_score", "overall_fit", "strong_matches", "gaps_and_questions"]
        }
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

  return JSON.parse(rawContent);
}

// Abstraction for Groq API calling (groq.com)
async function callGroqAPI(
  apiKey: string,
  resumeText: string,
  jobDescription: string,
  candidateDetails: any
): Promise<any> {
  let modelName = "qwen/qwen3.8-27b"; // Fallback default for this key
  try {
    const listResponse = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "User-Agent": "Mozilla/5.0",
      },
    });
    if (listResponse.ok) {
      const data = await listResponse.json();
      const models = data.data || [];
      const chatModel = models.find((m: any) => 
        (m.id.startsWith("llama-") || 
         m.id.startsWith("qwen/") || 
         m.id.startsWith("meta-llama/") ||
         m.id.startsWith("openai/gpt-")) &&
        !m.id.includes("whisper") && 
        !m.id.includes("guard")
      );
      if (chatModel) {
        modelName = chatModel.id;
      }
    }
  } catch (e) {
    console.error("Failed to dynamically resolve Groq model, defaulting to qwen/qwen3.8-27b", e);
  }

  const url = "https://api.groq.com/openai/v1/chat/completions";

  const systemPrompt = `You are an expert technical recruiter evaluating a candidate for a specific job opening.
Your job is to compare the candidate's resume against the job description requirements and provide an objective, evidence-based evaluation.

RULES:
1. Evaluate ONLY based on the provided resume and job description. Do not invent any credentials, experience, or qualifications.
2. Distinguish explicit evidence from assumptions. Identify uncertainty where information is missing or unclear.
3. Never treat missing information as proof that the candidate lacks a skill. Simply identify it as a gap or area of uncertainty.
4. STRICT COMPLIANCE: Do NOT use protected or sensitive personal characteristics (such as Age, Gender, Race, Religion, Disability, Marital Status) for candidate scoring or evaluation. These details might be provided in the candidate info, but they must NOT influence the match score or candidate fit summary in any way.
5. Avoid overly enthusiastic or marketing-like language. Be objective, calm, professional, and recruiter-focused.
6. Favor concrete evidence-based statements (e.g., "Candidate has 3 years of Excel data analysis, which matches the data manipulation requirement") over generic assertions.
7. Return a structured JSON response matching the required shape.

The response must be valid JSON only. Do not include any text before or after the JSON. Do not wrap in markdown code blocks.

Example JSON output structure:
{
  "match_score": 85,
  "overall_fit": "The candidate has strong alignment with the role based on their technical experience...",
  "strong_matches": [
    "Candidate has 3 years of data analysis experience using Excel, matching the data tool requirement."
  ],
  "gaps_and_questions": [
    {
      "gap": "No explicit mention of experience leading client presentations.",
      "question": "Can you walk us through a time you presented data findings to an external client?"
    }
  ]
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
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error("Empty response from Groq API");
  }

  return JSON.parse(rawContent);
}

// Abstraction for Grok API calling
async function callGrokAPI(
  apiKey: string,
  resumeText: string,
  jobDescription: string,
  candidateDetails: any
): Promise<any> {
  let modelName = "grok-4.3"; // Default for 2026
  try {
    const listResponse = await fetch("https://api.x.ai/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    if (listResponse.ok) {
      const data = await listResponse.json();
      const models = data.data || [];
      const chatModel = models.find((m: any) => 
        m.id.startsWith("grok-") && 
        !m.id.includes("imagine") && 
        !m.id.includes("vision")
      );
      if (chatModel) {
        modelName = chatModel.id;
      }
    }
  } catch (e) {
    console.error("Failed to dynamically resolve model, defaulting to grok-4.3", e);
  }

  const url = "https://api.x.ai/v1/chat/completions";

  const systemPrompt = `You are an expert technical recruiter evaluating a candidate for a specific job opening.
Your job is to compare the candidate's resume against the job description requirements and provide an objective, evidence-based evaluation.

RULES:
1. Evaluate ONLY based on the provided resume and job description. Do not invent any credentials, experience, or qualifications.
2. Distinguish explicit evidence from assumptions. Identify uncertainty where information is missing or unclear.
3. Never treat missing information as proof that the candidate lacks a skill. Simply identify it as a gap or area of uncertainty.
4. STRICT COMPLIANCE: Do NOT use protected or sensitive personal characteristics (such as Age, Gender, Race, Religion, Disability, Marital Status) for candidate scoring or evaluation. These details might be provided in the candidate info, but they must NOT influence the match score or candidate fit summary in any way.
5. Avoid overly enthusiastic or marketing-like language. Be objective, calm, professional, and recruiter-focused.
6. Favor concrete evidence-based statements (e.g., "Candidate has 3 years of Excel data analysis, which matches the data manipulation requirement") over generic assertions.
7. Return a structured JSON response matching the required shape.

The response must be valid JSON only. Do not include any text before or after the JSON. Do not wrap in markdown code blocks.

Example JSON output structure:
{
  "match_score": 85,
  "overall_fit": "The candidate has strong alignment with the role based on their technical experience...",
  "strong_matches": [
    "Candidate has 3 years of data analysis experience using Excel, matching the data tool requirement."
  ],
  "gaps_and_questions": [
    {
      "gap": "No explicit mention of experience leading client presentations.",
      "question": "Can you walk us through a time you presented data findings to an external client?"
    }
  ]
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
      response_format: { type: "json_object" },
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

  return JSON.parse(rawContent);
}

// Simulated mock result in case API key is missing or fails
function getMockScreeningResult(
  jobId: string,
  candidateName: string,
  resumeText: string
): any {
  // Simple check of text to customize the mock a tiny bit, showing it is not completely generic
  const hasExcel = /excel|sheet/i.test(resumeText);
  const hasMarketing = /marketing|social|content/i.test(resumeText);
  
  if (jobId === "opening-a") {
    return {
      match_score: hasExcel ? 82 : 68,
      overall_fit: `The candidate ${candidateName} shows decent alignment for the Founders Office Associate position. They have corporate experience that matches Tier-1 requirements, but require verification on outcomes-based planning capabilities.`,
      strong_matches: [
        `Has relevant technical consulting background with experience storyboarding presentations.`,
        hasExcel 
          ? `Demonstrated data analysis and manipulation skills using Excel.` 
          : `Mentions general research capabilities, though Excel usage is not explicitly highlighted.`,
        `Shows strong verbal and written communication suitable for executive interactions.`
      ],
      gaps_and_questions: [
        {
          gap: "Outcome-based planning milestones tracking is not detailed.",
          question: "Can you walk me through a complex project where you designed the milestones and managed risks yourself?"
        },
        {
          gap: "Direct experience working under pressure with founders is unclear.",
          question: "Describe a time you worked directly with a founder/CXO under tight deadlines. How did you manage expectations?"
        }
      ],
      isMock: true
    };
  } else {
    return {
      match_score: hasMarketing ? 85 : 65,
      overall_fit: `The candidate ${candidateName} demonstrates a strong background in content strategy and team leadership, which aligns well with the Content & Communities Lead role at House of Ved. However, their experience with Spotify/podcast platforms is unclear.`,
      strong_matches: [
        `Demonstrated 5+ years of experience across social products and platform ownership.`,
        hasMarketing 
          ? `Strong experience managing content calendars and creative teams for marketing campaigns.`
          : `General marketing background with experience coordinating service providers.`,
        `Exhibits stakeholder management skills suitable for a Senior Manager/Leadership role.`
      ],
      gaps_and_questions: [
        {
          gap: "Missing explicit evidence of managing guided meditation or specialized puja content products.",
          question: "What is your personal familiarity or experience with launching specialized content like guided meditations or puja products?"
        },
        {
          gap: "SEO and performance analytics tools usage on YouTube is not fully articulated.",
          question: "Can you share specific YouTube SEO strategies you used to grow a channel and what analytics tools you rely on?"
        }
      ],
      isMock: true
    };
  }
}

function sanitizeString(str: string): string {
  if (!str) return "";
  return str
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // remove control characters
    .replace(/\\/g, "\\\\") // escape backslashes
    .replace(/"/g, '\\"') // escape double quotes
    .replace(/\r?\n|\r/g, " ") // replace line breaks with spaces
    .replace(/[;{}|[\]]/g, "") // remove characters that can disrupt JSON schema parsing
    .trim();
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

    // Sanitize parameters
    const name = sanitizeString(rawName || "");
    const email = sanitizeString(rawEmail || "");
    const phone = sanitizeString(rawPhone || "");
    const address = sanitizeString(rawAddress || "");
    const age = sanitizeString(rawAge || "");
    const currentLocation = sanitizeString(rawCurrentLocation || "");

    // Validate inputs
    if (!file || !name || !email || !jobOpeningId) {
      return NextResponse.json(
        { error: "Missing required screening parameters." },
        { status: 400 }
      );
    }

    // Validate file type is DOCX
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "docx") {
      return NextResponse.json(
        { error: "Invalid file type. Only .docx files are accepted." },
        { status: 400 }
      );
    }

    // Extract text from docx
    let resumeText = "";
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const parseResult = await mammoth.extractRawText({ buffer });
      resumeText = parseResult.value || "";
      if (!resumeText.trim()) {
        return NextResponse.json(
          { error: "The uploaded resume seems to be empty." },
          { status: 400 }
        );
      }
      // Sanitize extracted resume text for JSON compatibility
      resumeText = resumeText
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .trim();
    } catch (parseError: any) {
      return NextResponse.json(
        { error: `Failed to parse DOCX file: ${parseError.message}` },
        { status: 400 }
      );
    }

    // Retrieve selected job description
    const job = jobOpenings.find((o) => o.id === jobOpeningId);
    if (!job) {
      return NextResponse.json(
        { error: "Selected job opening not found." },
        { status: 400 }
      );
    }

    const jobDescriptionFull = `
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}
Responsibilities:
${job.responsibilities.map((r) => `- ${r}`).join("\n")}
Skills Required:
${job.skills
  .map((s) => `[${s.category || "General"}]:\n${s.items.map((i) => `  - ${i}`).join("\n")}`)
  .join("\n")}
Experience Required:
${job.experience.map((e) => `- ${e}`).join("\n")}
`;

    // Extract API Key from headers or environment variables
    const apiKey = req.headers.get("x-llm-api-key") || process.env.LLM_API_KEY || process.env.GROK_API_KEY;

    if (!apiKey) {
      // Return mock screening if no API key is set
      const mockResult = getMockScreeningResult(jobOpeningId, name, resumeText);
      return NextResponse.json({
        ...mockResult,
        warning: "Running in simulated/mock mode because no LLM_API_KEY was supplied."
      });
    }

    try {
      let evaluation;
      if (apiKey.startsWith("gsk_")) {
        evaluation = await callGroqAPI(apiKey, resumeText, jobDescriptionFull, {
          name,
          email,
          currentLocation,
          age,
        });
      } else if (apiKey.startsWith("xai-")) {
        evaluation = await callGrokAPI(apiKey, resumeText, jobDescriptionFull, {
          name,
          email,
          currentLocation,
          age,
        });
      } else {
        evaluation = await callGeminiAPI(apiKey, resumeText, jobDescriptionFull, {
          name,
          email,
          currentLocation,
          age,
        });
      }

      // Basic validation of structured output
      if (
        typeof evaluation.match_score !== "number" ||
        !evaluation.overall_fit ||
        !Array.isArray(evaluation.strong_matches) ||
        !Array.isArray(evaluation.gaps_and_questions)
      ) {
        throw new Error("Invalid response format from LLM API");
      }

      // Save to database if connected
      if (sql) {
        try {
          await ensureTablesExist();
          const screeningId = `scr-${Date.now()}`;
          await sql`
            INSERT INTO screenings (id, candidate_name, candidate_email, candidate_phone, candidate_address, candidate_age, candidate_location, job_id, match_score, overall_fit, strong_matches, gaps_and_questions, warning)
            VALUES (
              ${screeningId},
              ${name},
              ${email},
              ${phone},
              ${address},
              ${Number(age)},
              ${currentLocation},
              ${jobOpeningId},
              ${evaluation.match_score},
              ${evaluation.overall_fit},
              ${evaluation.strong_matches || []},
              ${JSON.stringify(evaluation.gaps_and_questions || [])},
              ${evaluation.warning || null}
            )
          `;
          evaluation.id = screeningId;
        } catch (dbError) {
          console.error("Failed to save screening to database:", dbError);
        }
      }

      return NextResponse.json(evaluation);
    } catch (llmError: any) {
      console.error("LLM API screening failed:", llmError);
      
      // Graceful fallback to mock result with error information
      const mockResult = getMockScreeningResult(jobOpeningId, name, resumeText);
      
      // Save fallback mock result to database if connected so history is kept
      if (sql) {
        try {
          await ensureTablesExist();
          const screeningId = `scr-${Date.now()}`;
          const warningMsg = `LLM screening failed (${llmError.message}). Showing simulated result instead.`;
          await sql`
            INSERT INTO screenings (id, candidate_name, candidate_email, candidate_phone, candidate_address, candidate_age, candidate_location, job_id, match_score, overall_fit, strong_matches, gaps_and_questions, warning)
            VALUES (
              ${screeningId},
              ${name},
              ${email},
              ${phone},
              ${address},
              ${Number(age)},
              ${currentLocation},
              ${jobOpeningId},
              ${mockResult.match_score},
              ${mockResult.overall_fit},
              ${mockResult.strong_matches || []},
              ${JSON.stringify(mockResult.gaps_and_questions || [])},
              ${warningMsg}
            )
          `;
          mockResult.id = screeningId;
          mockResult.warning = warningMsg;
        } catch (dbError) {
          console.error("Failed to save fallback screening to database:", dbError);
        }
      }

      return NextResponse.json({
        ...mockResult,
        warning: mockResult.warning || `LLM screening failed (${llmError.message}). Showing simulated result instead.`,
      });
    }
  } catch (err: any) {
    console.error("Server error during screening:", err);
    return NextResponse.json(
      { error: "Internal server error during screening workflow." },
      { status: 500 }
    );
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
        warning: s.warning || undefined
      }));

      return NextResponse.json(formatted);
    } catch (error) {
      console.error("Failed to fetch screenings from database:", error);
      return NextResponse.json([]);
    }
  }
  return NextResponse.json([]);
}

export async function DELETE(req: NextRequest) {
  if (!sql) {
    return NextResponse.json({ success: true, warning: "Deleted only from local state." });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing screening ID." }, { status: 400 });
    }

    await ensureTablesExist();
    await sql`DELETE FROM screenings WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete screening from database:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
