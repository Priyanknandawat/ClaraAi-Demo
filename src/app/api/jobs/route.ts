import { NextRequest, NextResponse } from "next/server";
import { sql, ensureTablesExist } from "@/lib/db";
import { jobOpenings as defaultJobOpenings } from "@/data/jobs";

export async function GET() {
  if (sql) {
    try {
      await ensureTablesExist();
      const dbJobs = await sql`SELECT * FROM jobs ORDER BY created_at DESC`;
      
      // Map db columns to match the TypeScript JobOpening interface
      const formattedJobs = dbJobs.map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company,
        description: j.description,
        responsibilities: j.responsibilities || [],
        skills: typeof j.skills === "string" ? JSON.parse(j.skills) : j.skills,
        experience: j.experience || [],
        offers: j.offers || []
      }));

      // Combine default static jobs with database jobs (removing duplicates by ID)
      const combined = [...formattedJobs];
      defaultJobOpenings.forEach(dj => {
        if (!combined.some(c => c.id === dj.id)) {
          combined.push(dj);
        }
      });

      return NextResponse.json(combined);
    } catch (error: any) {
      console.error("Failed to fetch jobs from database:", error);
      return NextResponse.json(defaultJobOpenings);
    }
  }

  // Fallback to static JDs
  return NextResponse.json(defaultJobOpenings);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, company, description, responsibilities, skills, experience, offers } = body;

    if (!title || !company || !description) {
      return NextResponse.json(
        { error: "Missing required fields (title, company, description)." },
        { status: 400 }
      );
    }

    const newJob = {
      id: `job-${Date.now()}`,
      title,
      company,
      description,
      responsibilities: responsibilities || [],
      skills: skills || [],
      experience: experience || [],
      offers: offers || []
    };

    if (sql) {
      try {
        await ensureTablesExist();
        await sql`
          INSERT INTO jobs (id, title, company, description, responsibilities, skills, experience, offers)
          VALUES (
            ${newJob.id}, 
            ${newJob.title}, 
            ${newJob.company}, 
            ${newJob.description}, 
            ${newJob.responsibilities}, 
            ${JSON.stringify(newJob.skills)}, 
            ${newJob.experience}, 
            ${newJob.offers}
          )
        `;
        return NextResponse.json(newJob);
      } catch (dbError: any) {
        console.error("Failed to insert job in database:", dbError);
        return NextResponse.json(
          { error: `Database error: ${dbError.message}` },
          { status: 500 }
        );
      }
    }

    // Fallback response with warning
    return NextResponse.json({
      ...newJob,
      warning: "Saved only to browser storage because no database connection is active."
    });
  } catch (error: any) {
    console.error("Error creating job opening:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, company, description, responsibilities, skills, experience, offers } = body;

    if (!id || !title || !company || !description) {
      return NextResponse.json(
        { error: "Missing required fields (id, title, company, description)." },
        { status: 400 }
      );
    }

    const updatedJob = {
      id,
      title,
      company,
      description,
      responsibilities: responsibilities || [],
      skills: skills || [],
      experience: experience || [],
      offers: offers || []
    };

    if (sql) {
      try {
        await ensureTablesExist();
        // Check if job exists in DB, if so update, if not insert
        const existing = await sql`SELECT id FROM jobs WHERE id = ${id} LIMIT 1`;
        if (existing && existing.length > 0) {
          await sql`
            UPDATE jobs
            SET 
              title = ${updatedJob.title},
              company = ${updatedJob.company},
              description = ${updatedJob.description},
              responsibilities = ${updatedJob.responsibilities},
              skills = ${JSON.stringify(updatedJob.skills)},
              experience = ${updatedJob.experience},
              offers = ${updatedJob.offers}
            WHERE id = ${id}
          `;
        } else {
          // If it was a default static job being modified, insert it into DB
          await sql`
            INSERT INTO jobs (id, title, company, description, responsibilities, skills, experience, offers)
            VALUES (
              ${updatedJob.id}, 
              ${updatedJob.title}, 
              ${updatedJob.company}, 
              ${updatedJob.description}, 
              ${updatedJob.responsibilities}, 
              ${JSON.stringify(updatedJob.skills)}, 
              ${updatedJob.experience}, 
              ${updatedJob.offers}
            )
          `;
        }
        return NextResponse.json(updatedJob);
      } catch (dbError: any) {
        console.error("Failed to update job in database:", dbError);
        return NextResponse.json(
          { error: `Database error: ${dbError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(updatedJob);
  } catch (error: any) {
    console.error("Error updating job opening:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing job ID parameter." }, { status: 400 });
    }

    if (sql) {
      try {
        await ensureTablesExist();
        await sql`DELETE FROM jobs WHERE id = ${id}`;
        return NextResponse.json({ success: true, id });
      } catch (dbError: any) {
        console.error("Failed to delete job from database:", dbError);
        return NextResponse.json(
          { error: `Database error: ${dbError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("Error deleting job opening:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
