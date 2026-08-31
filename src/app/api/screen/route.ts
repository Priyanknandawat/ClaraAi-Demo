import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { jobOpenings } from "@/data/jobs";

// Abstraction for LLM calling
async function callGrokAPI(
  apiKey: string,
  resumeText: string,
  jobDescription: string,
  candidateDetails: any
): Promise<any> {
  const modelName = "grok-beta"; // or grok-2
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

Required JSON Output Format:
{
  "match_score": <number 0-100 based on alignment with job requirements>,
  "overall_fit": "<2-4 sentences explaining how well the candidate aligns with the role, highlighting key experiences>",
  "strong_matches": [
    "<Concrete strength 1 with specific resume evidence>",
    "<Concrete strength 2 with specific resume evidence>",
    "<Concrete strength 3 with specific resume evidence>"
  ],
  "gaps_and_questions": [
    {
      "gap": "<Uncertainty or missing evidence in resume>",
      "question": "<Specific, actionable recruiter follow-up question about this gap>"
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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;
    const email = formData.get("email") as string | null;
    const phone = formData.get("phone") as string | null;
    const address = formData.get("address") as string | null;
    const age = formData.get("age") as string | null;
    const currentLocation = formData.get("currentLocation") as string | null;
    const jobOpeningId = formData.get("jobOpeningId") as string | null;

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

    // Extract API Key
    const apiKey = process.env.LLM_API_KEY || process.env.GROK_API_KEY;

    if (!apiKey) {
      // Return mock screening if no API key is set
      const mockResult = getMockScreeningResult(jobOpeningId, name, resumeText);
      return NextResponse.json({
        ...mockResult,
        warning: "Running in simulated/mock mode because no LLM_API_KEY was supplied."
      });
    }

    try {
      const evaluation = await callGrokAPI(apiKey, resumeText, jobDescriptionFull, {
        name,
        email,
        currentLocation,
        age,
      });

      // Basic validation of structured output
      if (
        typeof evaluation.match_score !== "number" ||
        !evaluation.overall_fit ||
        !Array.isArray(evaluation.strong_matches) ||
        !Array.isArray(evaluation.gaps_and_questions)
      ) {
        throw new Error("Invalid response format from Grok API");
      }

      return NextResponse.json(evaluation);
    } catch (llmError: any) {
      console.error("Grok API screening failed:", llmError);
      
      // Graceful fallback to mock result with error information
      const mockResult = getMockScreeningResult(jobOpeningId, name, resumeText);
      return NextResponse.json({
        ...mockResult,
        warning: `LLM screening failed (${llmError.message}). Showing simulated result instead.`,
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
