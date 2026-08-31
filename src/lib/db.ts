import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

export const sql = connectionString ? postgres(connectionString, { ssl: "require" }) : null;

export async function ensureTablesExist() {
  if (!sql) return;

  try {
    // Create jobs table
    await sql`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        description TEXT NOT NULL,
        responsibilities TEXT[] NOT NULL DEFAULT '{}',
        skills JSONB NOT NULL DEFAULT '[]',
        experience TEXT[] NOT NULL DEFAULT '{}',
        offers TEXT[] NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create screenings table
    await sql`
      CREATE TABLE IF NOT EXISTS screenings (
        id TEXT PRIMARY KEY,
        candidate_name TEXT NOT NULL,
        candidate_email TEXT NOT NULL,
        candidate_phone TEXT NOT NULL,
        candidate_address TEXT NOT NULL,
        candidate_age INTEGER NOT NULL,
        candidate_location TEXT NOT NULL,
        job_id TEXT NOT NULL,
        match_score INTEGER NOT NULL,
        overall_fit TEXT NOT NULL,
        strong_matches TEXT[] NOT NULL DEFAULT '{}',
        gaps_and_questions JSONB NOT NULL DEFAULT '[]',
        screened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        warning TEXT,
        resume_text TEXT,
        resume_html TEXT
      )
    `;

    // Alter statements to add resume_text and resume_html columns to existing database tables if they already exist
    await sql`
      ALTER TABLE screenings ADD COLUMN IF NOT EXISTS resume_text TEXT
    `;
    await sql`
      ALTER TABLE screenings ADD COLUMN IF NOT EXISTS resume_html TEXT
    `;
    console.log("Database tables verified and migrated successfully.");
  } catch (error) {
    console.error("Failed to run database migrations:", error);
  }
}
