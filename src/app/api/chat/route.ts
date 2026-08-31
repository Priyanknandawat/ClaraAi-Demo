import { NextRequest, NextResponse } from "next/server";

// Ultra-Fast Groq Models Priority (Sub-300ms latency)
const GROQ_MODELS = [
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b"
];

async function callGroqChat(
  apiKey: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  const url = "https://api.groq.com/openai/v1/chat/completions";
  let lastError: Error | null = null;

  for (const model of GROQ_MODELS) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_tokens: 650,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 404 || response.status === 429) {
          lastError = new Error(`Groq ${model} error: ${response.status} - ${errText}`);
          continue;
        }
        throw new Error(`Groq API error: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return content;
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to generate response from Groq");
}

async function callGeminiChat(
  apiKey: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const systemMsg = messages.find((m) => m.role === "system");

  const body: any = { 
    contents,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 650
    }
  };
  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini");
  return text;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, messages, context } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY || (process.env.LLM_API_KEY?.startsWith("gsk_") ? process.env.LLM_API_KEY : undefined);
    const geminiKey = process.env.GEMINI_API_KEY || (process.env.LLM_API_KEY && !process.env.LLM_API_KEY.startsWith("gsk_") ? process.env.LLM_API_KEY : undefined);
    const customHeaderKey = req.headers.get("x-llm-api-key");

    const effectiveGroqKey = (customHeaderKey?.startsWith("gsk_") ? customHeaderKey : null) || groqKey;
    const effectiveGeminiKey = (customHeaderKey && !customHeaderKey.startsWith("gsk_") ? customHeaderKey : null) || geminiKey;

    let systemPrompt = "";

    if (mode === "candidate") {
      let formattedAllJobs = "";
      if (Array.isArray(context?.allJobs) && context.allJobs.length > 0) {
        formattedAllJobs = context.allJobs.map((j: any, idx: number) => 
          `${idx + 1}. **${j.title}** (${j.company}): ${j.description?.slice(0, 150)}...`
        ).join("\n");
      }

      systemPrompt = `You are "Clara CareerPulse AI", an intelligent and helpful career coach for candidates.

PRIMARY DIRECTIVE:
Directly and accurately answer the user's specific question based on their resume and target role. Keep responses clear, helpful, and concise.

Active Target Job:
${context?.jobTitle ? `Title: ${context.jobTitle} (${context.jobCompany || ""})\nDescription: ${context.jobDescription}` : "No specific job opening selected yet."}
${context?.resumeText ? `Candidate Resume: ${context.resumeText}` : ""}
${formattedAllJobs ? `All Available Openings in Company:\n${formattedAllJobs}` : ""}

Behavior Guidelines:
1. Clarification: If the user asks a general question (e.g. "How can I improve my resume?", "Give me interview questions", "What keywords should I add?") but has not specified a job role and no job is currently selected on screen:
   -> Proactively ask which role they want advice for: "Which job opening would you like to prepare for? Here are the active positions available: [List active job titles]".
2. Role-Specific Advice: If a target job is selected or specified in the prompt:
   -> Provide crisp keywords, 1-2 STAR bullet point improvements, and 2 role-specific practice questions.
3. Natural Assistance: Answer whatever specific question the user asks directly and concisely.`;
    } else {
      let formattedAllCandidates = "";
      if (Array.isArray(context?.allScreenings) && context.allScreenings.length > 0) {
        formattedAllCandidates = context.allScreenings.map((s: any, idx: number) => {
          const matchedJob = Array.isArray(context?.allJobs) ? context.allJobs.find((j: any) => j.id === s.jobId) : null;
          const resolvedTitle = s.jobTitle || matchedJob?.title || (s.jobId === "opening-a" ? "Founders Office Associate" : s.jobId === "opening-b" ? "Salesforce Developer Intern" : "General Role");
          const resolvedCompany = s.jobCompany || matchedJob?.company || (s.jobId === "opening-a" ? "Satva Partners" : s.jobId === "opening-b" ? "Salesforce" : "Company");

          return `
Candidate #${idx + 1}:
- Name: ${s.candidateName}
- Email: ${s.candidateEmail || "N/A"}
- Phone: ${s.candidatePhone || "N/A"}
- Location: ${s.candidateLocation || s.candidateAddress || "N/A"}
- Applied Position: ${resolvedTitle} (${resolvedCompany})
- Match Score: ${s.matchScore}%
- Overall Fit: ${s.overallFit}
- Key Verified Strengths: ${Array.isArray(s.strongMatches) ? s.strongMatches.join("; ") : "N/A"}
- Gaps / Risks: ${Array.isArray(s.gapsAndQuestions) ? s.gapsAndQuestions.map((g: any) => g.gap).join("; ") : "N/A"}
- Suggested Interview Questions: ${Array.isArray(s.gapsAndQuestions) ? s.gapsAndQuestions.map((g: any) => `"${g.question}"`).join("; ") : "N/A"}
- Screening Date: ${s.screenedAt || "Recent"}
`;
        }).join("\n");
      } else {
        formattedAllCandidates = "No candidate records recorded yet.";
      }

      let formattedAllJobs = "";
      if (Array.isArray(context?.allJobs) && context.allJobs.length > 0) {
        formattedAllJobs = context.allJobs.map((j: any, idx: number) => `
Job #${idx + 1}:
- Title: ${j.title}
- Company: ${j.company}
- Description: ${j.description}
- Responsibilities: ${Array.isArray(j.responsibilities) ? j.responsibilities.slice(0, 4).join("; ") : "N/A"}
- Required Skills: ${Array.isArray(j.skills) ? j.skills.map((sk: any) => Array.isArray(sk.items) ? sk.items.join(", ") : JSON.stringify(sk)).join("; ") : "N/A"}
`).join("\n");
      }

      systemPrompt = `You are "Clara TalentPulse AI", a versatile and sharp talent intelligence copilot for recruiters.

PRIMARY DIRECTIVE:
Answer EXACTLY what the user asks with strict adherence to the workspace candidate evaluation data.

WORKSPACE DATA:
==================================================
ALL CANDIDATE EVALUATION RECORDS:
${formattedAllCandidates}

ALL JOB REQUISITIONS:
${formattedAllJobs}
==================================================

Active View on Screen (if any):
${context?.selectedScreening ? `Currently Focused Candidate: ${context.selectedScreening.candidateName} (${context.selectedScreening.jobTitle}) - Score: ${context.selectedScreening.matchScore}%` : "No specific candidate currently focused."}
${context?.selectedJob ? `Currently Focused Job: ${context.selectedJob.title} (${context.selectedJob.company})` : ""}

STRICT ROLE INTEGRITY & CHECKSUM RULES:
1. Strict Role Verification: Check the candidate's exact "Applied Position".
   - If the user asks about a role (e.g. "for QA role") that does NOT match any candidates in the workspace, explicitly state:
     "None of the candidates in your workspace applied for [Asked Role]. The current candidates applied for:
     • [Candidate 1] -> [Applied Position]
     • [Candidate 2] -> [Applied Position]"
   - Never confuse or re-attribute a candidate's evaluation to a different job profile.
2. Clarification for General Requests:
   - If the user asks to "Compare candidates" or "Who is the best candidate?" WITHOUT specifying a role:
     -> If candidates exist: Ask "Which job opening or candidates would you like to compare? Available positions:\n[List numbered job titles]".
     -> If no candidates exist: State "No candidate evaluations are recorded yet. Please screen candidate resumes first or specify an active job opening."
   - If the user asks to "Draft an interview invite", "What are the risks?", or "Generate an executive report" WITHOUT specifying a candidate name or role:
     -> If candidates exist: Ask "Which candidate or job opening would you like this for? Available candidates:\n[List candidate names with their actual applied roles]".
     -> If no candidates exist: Ask "Which job opening would you like to draft this for? Active positions in workspace:\n[List active job openings]".
3. Normal & Compact Email Drafting:
   - When asked to write an email (invite, follow-up, rejection), keep it as a normal, clean, 4-sentence email (Subject + greeting + 2-3 short body sentences + sign-off).
   - DO NOT generate giant markdown tables, evaluation grids, or huge interview matrices inside an email.
4. Direct & Precise Answers: For valid, specific queries, provide concise and accurate data immediately.`;
    }

    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ];

    let reply = "";

    if (effectiveGroqKey) {
      try {
        reply = await callGroqChat(effectiveGroqKey, fullMessages);
      } catch (e: any) {
        console.warn("Groq chat failed, attempting Gemini fallback:", e.message);
      }
    }

    if (!reply && effectiveGeminiKey) {
      try {
        reply = await callGeminiChat(effectiveGeminiKey, fullMessages);
      } catch (e: any) {
        console.warn("Gemini chat failed:", e.message);
      }
    }

    if (!reply) {
      // Fallback heuristic response if no LLM key is configured
      if (mode === "candidate") {
        reply = `**Clara Career Coach Tips for ${context?.jobTitle || "Your Target Role"}:**\n\n1. **Highlight Core Competencies**: Review the job description and ensure terms like *problem-solving*, *cross-functional execution*, and role-specific tools are prominently featured in your experience section.\n2. **Quantify Achievements**: Rephrase bullet points to include numbers (e.g. *"Executed 20+ test scenarios reducing bug leakage by 30%"*).\n3. **Prepare for Technical Questions**: Be ready to walk interviewers through an end-to-end project where you overcame a technical constraint.`;
      } else {
        reply = `### Executive Candidate Summary\n\n* **Candidate**: ${context?.selectedScreening?.candidateName || "Candidate"}\n* **Match Score**: ${context?.selectedScreening?.matchScore || 75}%\n* **Recommendation**: Candidate demonstrates baseline aptitude. We recommend advancing to a 30-minute structured phone screen to verify execution depth in flagged gap areas.`;
      }
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Chat route error:", error);
    return NextResponse.json({ error: error.message || "Failed to process chat" }, { status: 500 });
  }
}
