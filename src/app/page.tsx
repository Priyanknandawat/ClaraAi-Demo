"use client";

import React, { useState, useEffect, useRef } from "react";
import { jobOpenings as defaultJobOpenings, JobOpening } from "@/data/jobs";

interface SavedScreening {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateAddress: string;
  candidateAge: number;
  candidateLocation: string;
  jobId: string;
  jobTitle: string;
  jobCompany: string;
  matchScore: number;
  overallFit: string;
  strongMatches: string[];
  gapsAndQuestions: { gap: string; question: string }[];
  warning?: string;
  resumeText?: string;
  resumeHtml?: string;
  screenedAt: string;
}

interface CandidateForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  age: string;
  currentLocation: string;
}

interface FormValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  age?: string;
  jobId?: string;
  file?: string;
}

interface JobForm {
  title: string;
  company: string;
  description: string;
  responsibilitiesText: string;
  experienceText: string;
  skillsText: string;
}

interface JobFormErrors {
  title?: string;
  company?: string;
  description?: string;
  responsibilities?: string;
}

const initialForm: CandidateForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  age: "",
  currentLocation: ""
};

const initialJobForm: JobForm = {
  title: "",
  company: "",
  description: "",
  responsibilitiesText: "",
  experienceText: "",
  skillsText: ""
};

const defaultSampleScreenings: SavedScreening[] = [
  {
    id: "scr-1",
    candidateName: "Aditi Sharma",
    candidateEmail: "aditi.sharma@example.com",
    candidatePhone: "+91 98765 43210",
    candidateAddress: "Indiranagar, Bengaluru, Karnataka",
    candidateAge: 26,
    candidateLocation: "Bengaluru",
    jobId: "opening-a",
    jobTitle: "Founders Office Associate",
    jobCompany: "Satva Partners",
    matchScore: 92,
    overallFit: "Aditi demonstrates exceptional alignment for the Founders Office Associate position. Her Tier-1 consulting background, executive storyboarding skills, and proven outcomes-based delivery directly match the core requirements.",
    strongMatches: [
      "3 years of strategy consulting at a Tier-1 management consultancy",
      "Extensive experience conducting quantitative data analysis and executive PowerPoint decks",
      "Demonstrated outcomes-based project ownership and cross-functional team coordination"
    ],
    gapsAndQuestions: [
      {
        gap: "Experience with Sanskrit/Bharatiya business context is not explicitly mentioned.",
        question: "How do you align with Satva's philosophy of blending ancient ethos with modern commercial growth?"
      }
    ],
    screenedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "scr-2",
    candidateName: "Gautam Verma",
    candidateEmail: "gautam.v@example.com",
    candidatePhone: "+91 98111 22334",
    candidateAddress: "DLF Phase 5, Gurugram, Haryana",
    candidateAge: 27,
    candidateLocation: "Gurugram",
    jobId: "opening-a",
    jobTitle: "Founders Office Associate",
    jobCompany: "Satva Partners",
    matchScore: 74,
    overallFit: "Gautam shows moderate to strong fit with good corporate background and strong communications, but requires deeper verification regarding financial modeling and presentation storyboarding capabilities.",
    strongMatches: [
      "2.5 years of corporate advisory experience",
      "Solid stakeholder communication and cross-team project tracking"
    ],
    gapsAndQuestions: [
      {
        gap: "Excel data modeling depth is unclear from project summaries.",
        question: "Can you describe a scenario where you built a complex data model under tight executive deadlines?"
      }
    ],
    screenedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "scr-3",
    candidateName: "Rohan Kapoor",
    candidateEmail: "rohan.kapoor@example.com",
    candidatePhone: "+91 98200 11223",
    candidateAddress: "Bandra West, Mumbai, Maharashtra",
    candidateAge: 24,
    candidateLocation: "Mumbai",
    jobId: "opening-a",
    jobTitle: "Founders Office Associate",
    jobCompany: "Satva Partners",
    matchScore: 68,
    overallFit: "Rohan has strong technical agility and rapid execution capabilities. While his primary background is operations and product coordination, his structured problem solving and initiative provide foundational aptitude.",
    strongMatches: [
      "Demonstrated fast operational execution and project workflow design",
      "Clear structured communication and ownership mindset"
    ],
    gapsAndQuestions: [
      {
        gap: "Executive deck storyboarding in Tier-1 consulting environments needs verification.",
        question: "Walk us through an executive presentation you designed from scratch for senior stakeholders."
      }
    ],
    screenedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export default function ClaraAiPlatform() {
  // Portal Mode: "recruiter" | "candidate"
  const [portalMode, setPortalMode] = useState<"recruiter" | "candidate">("recruiter");

  // Recruiter Tabs: 'landing' | 'dashboard' | 'screenings' | 'compare' | 'screen' | 'jobs' | 'candidates' | 'settings'
  const [activeTab, setActiveTab] = useState<"landing" | "dashboard" | "screenings" | "compare" | "screen" | "jobs" | "candidates" | "settings">("landing");
  const [screenings, setScreenings] = useState<SavedScreening[]>([]);
  const [jobOpeningsList, setJobOpeningsList] = useState<JobOpening[]>(defaultJobOpenings);
  const [selectedScreeningId, setSelectedScreeningId] = useState<string | null>(null);

  // Side-by-Side Comparison States
  const [compareJobId, setCompareJobId] = useState<string>("opening-a");
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);

  // Screening Form Workflow States: 'form' | 'review' | 'screening'
  const [formStep, setFormStep] = useState<"form" | "review" | "screening">("form");
  const [form, setForm] = useState<CandidateForm>(initialForm);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<FormValidationErrors>({});

  // Job Opening Form workflow
  const [jobForm, setJobForm] = useState<JobForm>(initialJobForm);
  const [showAddJobForm, setShowAddJobForm] = useState<boolean>(false);
  const [jobFormErrors, setJobFormErrors] = useState<JobFormErrors>({});
  const [jobApiError, setJobApiError] = useState<string | null>(null);
  const [isJobLoading, setIsJobLoading] = useState<boolean>(false);

  // Edit Job Opening workflow
  const [editingJob, setEditingJob] = useState<JobOpening | null>(null);
  const [editJobForm, setEditJobForm] = useState<JobForm>(initialJobForm);
  const [editJobFormErrors, setEditJobFormErrors] = useState<JobFormErrors>({});
  const [editJobApiError, setEditJobApiError] = useState<string | null>(null);
  const [isEditJobLoading, setIsEditJobLoading] = useState<boolean>(false);

  // Candidate Portal specific states
  const [candidatePortalJob, setCandidatePortalJob] = useState<JobOpening | null>(null);
  const [candidateForm, setCandidateForm] = useState<CandidateForm>(initialForm);
  const [candidateResumeFile, setCandidateResumeFile] = useState<File | null>(null);
  const [candidateFormErrors, setCandidateFormErrors] = useState<FormValidationErrors>({});
  const [candidateApplying, setCandidateApplying] = useState<boolean>(false);
  const [candidateAppliedSuccess, setCandidateAppliedSuccess] = useState<boolean>(false);
  const [candidateCategoryFilter, setCandidateCategoryFilter] = useState<string>("all");
  const [candidateSearchQuery, setCandidateSearchQuery] = useState<string>("");

  // Settings states
  const [tempApiKey, setTempApiKey] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const candidateFileInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter states for Screenings table
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterJobId, setFilterJobId] = useState<string>("all");
  const [filterFit, setFilterFit] = useState<string>("all");

  // Delete Confirmation Modal State (Apple Glass Dialog)
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    type: "job" | "screening";
    id: string;
    title: string;
    subtitle: string;
  } | null>(null);

  // Modern Toast Notification Message
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Lock background scroll when any modal is open to prevent background text bleed
  useEffect(() => {
    if (candidatePortalJob || editingJob || deleteConfirmState) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [candidatePortalJob, editingJob, deleteConfirmState]);

  // Load database jobs and screenings on mount (with localStorage fallback)
  useEffect(() => {
    async function loadData() {
      try {
        const [jobsRes, scrRes] = await Promise.all([
          fetch("/api/jobs"),
          fetch("/api/screen")
        ]);

        let loadedJobs: JobOpening[] = [];
        let loadedScreenings: SavedScreening[] = [];

        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          if (Array.isArray(jobsData) && jobsData.length > 0) {
            loadedJobs = jobsData;
            setJobOpeningsList(jobsData);
          }
        }

        if (scrRes.ok) {
          const scrData = await scrRes.json();
          if (Array.isArray(scrData) && scrData.length > 0) {
            loadedScreenings = scrData;
            setScreenings(scrData);
          }
        }

        if (loadedScreenings.length === 0) {
          const localScr = localStorage.getItem("clara_screenings");
          if (localScr) {
            try {
              const parsed = JSON.parse(localScr);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setScreenings(parsed);
              } else {
                setScreenings(defaultSampleScreenings);
              }
            } catch {
              setScreenings(defaultSampleScreenings);
            }
          } else {
            setScreenings(defaultSampleScreenings);
          }
        }
      } catch (e) {
        console.warn("Could not fetch remote database records, using local fallback", e);
        const localScr = localStorage.getItem("clara_screenings");
        if (localScr) {
          try {
            setScreenings(JSON.parse(localScr));
          } catch {
            setScreenings(defaultSampleScreenings);
          }
        } else {
          setScreenings(defaultSampleScreenings);
        }
      }
    }

    loadData();

    const savedKey = localStorage.getItem("clara_custom_api_key");
    if (savedKey) setTempApiKey(savedKey);
  }, []);

  // Sync default comparison candidates whenever compareJobId or screenings change
  useEffect(() => {
    const matching = screenings.filter(s => s.jobId === compareJobId || (jobOpeningsList.length > 0 && s.jobTitle === jobOpeningsList.find(j => j.id === compareJobId)?.title));
    if (matching.length > 0) {
      setSelectedCompareIds(matching.slice(0, 3).map(s => s.id));
    } else {
      setSelectedCompareIds([]);
    }
  }, [compareJobId, screenings]);

  const saveScreeningsToStorage = (updated: SavedScreening[]) => {
    setScreenings(updated);
    try {
      localStorage.setItem("clara_screenings", JSON.stringify(updated));
    } catch {}
  };

  const showToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => {
      setToastNotification((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      localStorage.setItem("clara_custom_api_key", tempApiKey.trim());
      showToast("API Key saved to browser storage.");
    } else {
      localStorage.removeItem("clara_custom_api_key");
      showToast("Custom API Key cleared.");
    }
  };

  // STRICT VALIDATION HELPERS
  const validateCandidateData = (data: CandidateForm, file: File | null, jobId?: string): FormValidationErrors => {
    const errors: FormValidationErrors = {};

    // Name: At least 2 characters, only letters, spaces, dots, hyphens
    if (!data.name.trim()) {
      errors.name = "Candidate name is required.";
    } else if (data.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters long.";
    } else if (!/^[a-zA-Z\s.'-]+$/.test(data.name.trim())) {
      errors.name = "Name must only contain letters, spaces, dots, or hyphens.";
    }

    // Email: Strict RFC format check
    if (!data.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data.email.trim())) {
      errors.email = "Please enter a valid email address (e.g. name@domain.com).";
    }

    // Phone: Digits, +, -, spaces, parentheses, min 8 digits
    const cleanedPhone = data.phone.replace(/[^0-9]/g, "");
    if (!data.phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (cleanedPhone.length < 8 || cleanedPhone.length > 15) {
      errors.phone = "Phone number must contain between 8 and 15 digits.";
    } else if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}$/.test(data.phone.trim())) {
      errors.phone = "Please enter a valid phone number (e.g. +91 98200 11223).";
    }

    // Current Location: Min 2 characters
    if (!data.currentLocation.trim()) {
      errors.location = "Current location is required.";
    } else if (data.currentLocation.trim().length < 2) {
      errors.location = "Location must be at least 2 characters.";
    }

    // Age: Integer between 18 and 99
    if (!data.age.trim()) {
      errors.age = "Age is required.";
    } else {
      const parsedAge = Number(data.age);
      if (isNaN(parsedAge) || !Number.isInteger(parsedAge) || parsedAge < 18 || parsedAge > 99) {
        errors.age = "Candidate age must be an integer between 18 and 99.";
      }
    }

    // Target Role check (if applicable)
    if (jobId !== undefined && !jobId) {
      errors.jobId = "Please select a target job opening.";
    }

    // File check
    if (!file) {
      errors.file = "Please upload a valid Microsoft Word (.docx) resume.";
    }

    return errors;
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let sanitizedValue = value;
    if (name === "phone") {
      sanitizedValue = value.replace(/[^0-9+\s\-()]/g, "");
    } else if (name === "age") {
      sanitizedValue = value.replace(/[^0-9]/g, "").slice(0, 2);
    }

    setForm((prev) => ({ ...prev, [name]: sanitizedValue }));
    if (formErrors[name as keyof FormValidationErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCandidateFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let sanitizedValue = value;
    if (name === "phone") {
      sanitizedValue = value.replace(/[^0-9+\s\-()]/g, "");
    } else if (name === "age") {
      sanitizedValue = value.replace(/[^0-9]/g, "").slice(0, 2);
    }

    setCandidateForm((prev) => ({ ...prev, [name]: sanitizedValue }));
    if (candidateFormErrors[name as keyof FormValidationErrors]) {
      setCandidateFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormErrors((prev) => ({ ...prev, file: undefined }));
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (extension !== "docx") {
        setFormErrors((prev) => ({ ...prev, file: "Invalid file type. Please upload a Microsoft Word document (.docx)." }));
        setResumeFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors((prev) => ({ ...prev, file: "File is too large. Maximum size is 5MB." }));
        setResumeFile(null);
        return;
      }
      setResumeFile(file);
    }
  };

  const handleCandidateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCandidateFormErrors((prev) => ({ ...prev, file: undefined }));
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (extension !== "docx") {
        setCandidateFormErrors((prev) => ({ ...prev, file: "Invalid file format. Only Microsoft Word (.docx) documents are accepted." }));
        setCandidateResumeFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setCandidateFormErrors((prev) => ({ ...prev, file: "File is too large. Maximum allowed size is 5MB." }));
        setCandidateResumeFile(null);
        return;
      }
      setCandidateResumeFile(file);
    }
  };

  const handleReviewStep = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateCandidateData(form, resumeFile, selectedJobId);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormStep("review");
  };

  const handleInitiateScreening = async () => {
    if (!resumeFile || !selectedJobId) return;

    setIsLoading(true);
    setApiError(null);
    setFormStep("screening");

    const currentJob = jobOpeningsList.find((j) => j.id === selectedJobId);

    const formData = new FormData();
    formData.append("file", resumeFile);
    formData.append("name", form.name.trim());
    formData.append("email", form.email.trim());
    formData.append("phone", form.phone.trim());
    formData.append("address", form.address.trim());
    formData.append("age", form.age.trim());
    formData.append("currentLocation", form.currentLocation.trim());
    formData.append("jobOpeningId", selectedJobId);
    if (currentJob) {
      formData.append("jobTitle", currentJob.title);
      formData.append("jobCompany", currentJob.company);
      formData.append("jobDescription", currentJob.description);
    }

    const headers: Record<string, string> = {};
    const customKey = localStorage.getItem("clara_custom_api_key");
    if (customKey) {
      headers["x-llm-api-key"] = customKey;
    }

    try {
      const response = await fetch("/api/screen", {
        method: "POST",
        headers,
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Screening failed. Please check your inputs or API key.");
      }

      const newScreening: SavedScreening = {
        id: data.id || `scr-${Date.now()}`,
        candidateName: form.name.trim(),
        candidateEmail: form.email.trim(),
        candidatePhone: form.phone.trim(),
        candidateAddress: form.address.trim(),
        candidateAge: Number(form.age) || 25,
        candidateLocation: form.currentLocation.trim(),
        jobId: selectedJobId,
        jobTitle: currentJob ? currentJob.title : "Target Role",
        jobCompany: currentJob ? currentJob.company : "Company",
        matchScore: data.match_score ?? 70,
        overallFit: data.overall_fit ?? "Evaluation complete.",
        strongMatches: data.strong_matches ?? [],
        gapsAndQuestions: data.gaps_and_questions ?? [],
        warning: data.warning,
        resumeText: data.resumeText,
        resumeHtml: data.resumeHtml,
        screenedAt: new Date().toISOString()
      };

      const updated = [newScreening, ...screenings];
      saveScreeningsToStorage(updated);
      setSelectedScreeningId(newScreening.id);
      setActiveTab("screenings");
      resetFormWorkflow();
    } catch (err: any) {
      setApiError(err.message || "An unexpected error occurred during evaluation.");
      setFormStep("review");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCandidatePortalApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidatePortalJob) return;

    const errors = validateCandidateData(candidateForm, candidateResumeFile);
    if (Object.keys(errors).length > 0) {
      setCandidateFormErrors(errors);
      return;
    }

    if (!candidateResumeFile) return;

    setCandidateApplying(true);
    setCandidateAppliedSuccess(false);

    const formData = new FormData();
    formData.append("file", candidateResumeFile);
    formData.append("name", candidateForm.name.trim());
    formData.append("email", candidateForm.email.trim());
    formData.append("phone", candidateForm.phone.trim());
    formData.append("address", candidateForm.address.trim() || candidateForm.currentLocation.trim());
    formData.append("age", candidateForm.age.trim());
    formData.append("currentLocation", candidateForm.currentLocation.trim());
    formData.append("jobOpeningId", candidatePortalJob.id);
    formData.append("jobTitle", candidatePortalJob.title);
    formData.append("jobCompany", candidatePortalJob.company);
    formData.append("jobDescription", candidatePortalJob.description);

    try {
      const response = await fetch("/api/screen", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Application submission failed.");
      }

      const newScreening: SavedScreening = {
        id: data.id || `scr-${Date.now()}`,
        candidateName: candidateForm.name.trim(),
        candidateEmail: candidateForm.email.trim(),
        candidatePhone: candidateForm.phone.trim(),
        candidateAddress: candidateForm.address.trim() || candidateForm.currentLocation.trim(),
        candidateAge: Number(candidateForm.age) || 25,
        candidateLocation: candidateForm.currentLocation.trim(),
        jobId: candidatePortalJob.id,
        jobTitle: candidatePortalJob.title,
        jobCompany: candidatePortalJob.company,
        matchScore: data.match_score ?? 70,
        overallFit: data.overall_fit ?? "Application received and analyzed.",
        strongMatches: data.strong_matches ?? [],
        gapsAndQuestions: data.gaps_and_questions ?? [],
        warning: data.warning,
        resumeText: data.resumeText,
        resumeHtml: data.resumeHtml,
        screenedAt: new Date().toISOString()
      };

      const updated = [newScreening, ...screenings];
      saveScreeningsToStorage(updated);
      setCandidateAppliedSuccess(true);
    } catch (err: any) {
      alert("Error submitting application: " + err.message);
    } finally {
      setCandidateApplying(false);
    }
  };

  const resetFormWorkflow = () => {
    setForm(initialForm);
    setSelectedJobId("");
    setResumeFile(null);
    setFormErrors({});
    setFormStep("form");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownloadResume = (screening: SavedScreening) => {
    if (screening.resumeHtml) {
      const wordContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${screening.candidateName} - Resume</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1e293b; margin: 1in; }
    h1, h2, h3, h4 { color: #0f172a; font-weight: bold; margin-top: 14pt; margin-bottom: 4pt; }
    h1 { font-size: 18pt; border-bottom: 2pt solid #2563eb; padding-bottom: 4pt; }
    h2 { font-size: 14pt; border-bottom: 1pt solid #94a3b8; padding-bottom: 2pt; }
    p { margin-bottom: 6pt; }
    ul, ol { margin-top: 3pt; margin-bottom: 6pt; padding-left: 20pt; }
    table { width: 100%; border-collapse: collapse; margin: 10pt 0; }
    th, td { border: 1pt solid #cbd5e1; padding: 6pt 8pt; text-align: left; }
    th { background-color: #f1f5f9; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  ${screening.resumeHtml}
</body>
</html>`;
      const blob = new Blob([wordContent], { type: "application/msword;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${screening.candidateName.replace(/[^a-zA-Z0-9]/g, "_")}_Resume.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (screening.resumeText) {
      const blob = new Blob([screening.resumeText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${screening.candidateName.replace(/[^a-zA-Z0-9]/g, "_")}_Resume.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Add Job Opening Action with strict validation
  const handleAddJobOpening = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: JobFormErrors = {};

    if (!jobForm.title.trim() || jobForm.title.trim().length < 3) {
      errors.title = "Position title must be at least 3 characters long.";
    }
    if (!jobForm.company.trim() || jobForm.company.trim().length < 2) {
      errors.company = "Company name must be at least 2 characters long.";
    }
    if (!jobForm.description.trim() || jobForm.description.trim().length < 15) {
      errors.description = "Role description must be at least 15 characters long.";
    }

    if (Object.keys(errors).length > 0) {
      setJobFormErrors(errors);
      return;
    }

    setIsJobLoading(true);
    setJobApiError(null);
    setJobFormErrors({});

    const formatList = (text: string) => text.split("\n").map(l => l.trim()).filter(l => l !== "");
    const responsibilities = formatList(jobForm.responsibilitiesText);
    const experience = formatList(jobForm.experienceText);
    const skillsList = formatList(jobForm.skillsText);
    const skills = [{ category: "Required Core Skills", items: skillsList }];

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: jobForm.title.trim(),
          company: jobForm.company.trim(),
          description: jobForm.description.trim(),
          responsibilities,
          skills,
          experience,
          offers: []
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create job opening.");
      }

      const updated = [...jobOpeningsList, data];
      setJobOpeningsList(updated);
      setJobForm(initialJobForm);
      setShowAddJobForm(false);
    } catch (err: any) {
      setJobApiError(err.message || "Failed to save job opening.");
    } finally {
      setIsJobLoading(false);
    }
  };

  // Open Edit Job Modal with pre-filled fields
  const handleOpenEditJob = (job: JobOpening) => {
    setEditingJob(job);
    setEditJobForm({
      title: job.title,
      company: job.company,
      description: job.description,
      responsibilitiesText: (job.responsibilities || []).join("\n"),
      experienceText: (job.experience || []).join("\n"),
      skillsText: (job.skills || []).map(s => (s.items || []).join("\n")).join("\n")
    });
    setEditJobFormErrors({});
    setEditJobApiError(null);
  };

  // Update Job Opening Action with strict validation
  const handleUpdateJobOpening = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    const errors: JobFormErrors = {};
    if (!editJobForm.title.trim() || editJobForm.title.trim().length < 3) {
      errors.title = "Position title must be at least 3 characters long.";
    }
    if (!editJobForm.company.trim() || editJobForm.company.trim().length < 2) {
      errors.company = "Company name must be at least 2 characters long.";
    }
    if (!editJobForm.description.trim() || editJobForm.description.trim().length < 15) {
      errors.description = "Role description must be at least 15 characters long.";
    }

    if (Object.keys(errors).length > 0) {
      setEditJobFormErrors(errors);
      return;
    }

    setIsEditJobLoading(true);
    setEditJobApiError(null);

    const formatList = (text: string) => text.split("\n").map(l => l.trim()).filter(l => l !== "");
    const responsibilities = formatList(editJobForm.responsibilitiesText);
    const experience = formatList(editJobForm.experienceText);
    const skillsList = formatList(editJobForm.skillsText);
    const skills = [{ category: "Required Core Skills", items: skillsList }];

    const updatedPayload: JobOpening = {
      id: editingJob.id,
      title: editJobForm.title.trim(),
      company: editJobForm.company.trim(),
      description: editJobForm.description.trim(),
      responsibilities,
      skills,
      experience,
      offers: editingJob.offers || []
    };

    try {
      const response = await fetch("/api/jobs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPayload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update job opening.");
      }

      setJobOpeningsList(prev => prev.map(j => j.id === editingJob.id ? { ...updatedPayload, ...data } : j));
      setEditingJob(null);
    } catch (err: any) {
      setEditJobApiError(err.message || "Failed to update job opening.");
    } finally {
      setIsEditJobLoading(false);
    }
  };

  // Trigger Apple-Style Delete Confirmation for Job Opening
  const triggerDeleteJobOpening = (jobId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetJob = jobOpeningsList.find(j => j.id === jobId);
    setDeleteConfirmState({
      isOpen: true,
      type: "job",
      id: jobId,
      title: "Delete Job Position?",
      subtitle: `Are you sure you want to delete "${targetJob ? targetJob.title : "this position"}"? This will also remove it from active career postings.`
    });
  };

  // Trigger Apple-Style Delete Confirmation for Evaluation Record
  const triggerDeleteScreening = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = screenings.find(s => s.id === id);
    setDeleteConfirmState({
      isOpen: true,
      type: "screening",
      id,
      title: "Delete Evaluation Record?",
      subtitle: `Are you sure you want to permanently delete the evaluation report for "${target ? target.candidateName : "this candidate"}"?`
    });
  };

  // Confirm and Execute Delete
  const handleExecuteDelete = async () => {
    if (!deleteConfirmState) return;

    if (deleteConfirmState.type === "job") {
      const jobId = deleteConfirmState.id;
      try {
        await fetch(`/api/jobs?id=${jobId}`, { method: "DELETE" });
      } catch (err) {
        console.warn("Could not delete from database, removing locally", err);
      }
      const updated = jobOpeningsList.filter(j => j.id !== jobId);
      setJobOpeningsList(updated);
      if (compareJobId === jobId && updated.length > 0) {
        setCompareJobId(updated[0].id);
      }
      if (selectedJobId === jobId) {
        setSelectedJobId("");
      }
      showToast("Job position deleted successfully.");
    } else if (deleteConfirmState.type === "screening") {
      const id = deleteConfirmState.id;
      try {
        await fetch(`/api/screen?id=${id}`, { method: "DELETE" });
      } catch (err) {
        console.warn("Could not delete from database, removing locally", err);
      }
      const filtered = screenings.filter(s => s.id !== id);
      saveScreeningsToStorage(filtered);
      if (selectedScreeningId === id) {
        setSelectedScreeningId(null);
      }
      showToast("Evaluation record deleted.");
    }

    setDeleteConfirmState(null);
  };

  // Score styling helper
  const getScoreRating = (score: number) => {
    if (score >= 85) return { text: "Strong match", color: "bg-emerald-50 text-emerald-700 border-emerald-200", bar: "bg-emerald-500" };
    if (score >= 70) return { text: "Good fit", color: "bg-blue-50 text-blue-700 border-blue-200", bar: "bg-blue-500" };
    if (score >= 50) return { text: "Moderate fit", color: "bg-amber-50 text-amber-700 border-amber-200", bar: "bg-amber-500" };
    return { text: "Weak fit", color: "bg-rose-50 text-rose-700 border-rose-200", bar: "bg-rose-500" };
  };

  // Filtered Screenings list
  const getFilteredScreenings = () => {
    return screenings.filter(s => {
      const matchesSearch = 
        s.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesJob = filterJobId === "all" || s.jobId === filterJobId;
      
      let matchesFit = true;
      if (filterFit !== "all") {
        if (filterFit === "strong") matchesFit = s.matchScore >= 85;
        else if (filterFit === "good") matchesFit = s.matchScore >= 70 && s.matchScore < 85;
        else if (filterFit === "moderate") matchesFit = s.matchScore >= 50 && s.matchScore < 70;
        else if (filterFit === "weak") matchesFit = s.matchScore < 50;
      }

      return matchesSearch && matchesJob && matchesFit;
    });
  };

  // Global Candidates grouping
  const getGlobalCandidates = () => {
    const candidatesMap = new Map<string, {
      name: string;
      email: string;
      phone: string;
      location: string;
      applicationsCount: number;
      latestRole: string;
      latestScore: number;
      screenings: SavedScreening[];
    }>();

    screenings.forEach(s => {
      const key = s.candidateEmail.toLowerCase().trim();
      const existing = candidatesMap.get(key);

      if (existing) {
        existing.applicationsCount += 1;
        if (new Date(s.screenedAt) > new Date(existing.screenings[0].screenedAt)) {
          existing.latestRole = s.jobTitle;
          existing.latestScore = s.matchScore;
        }
        existing.screenings.push(s);
      } else {
        candidatesMap.set(key, {
          name: s.candidateName,
          email: s.candidateEmail,
          phone: s.candidatePhone,
          location: s.candidateLocation,
          applicationsCount: 1,
          latestRole: s.jobTitle,
          latestScore: s.matchScore,
          screenings: [s]
        });
      }
    });

    return Array.from(candidatesMap.values());
  };

  const selectedJob = jobOpeningsList.find(j => j.id === selectedJobId);
  const activeScreening = screenings.find(s => s.id === selectedScreeningId);

  // Candidate comparison helpers
  const compareMatchingScreenings = screenings.filter(s => s.jobId === compareJobId || (jobOpeningsList.length > 0 && s.jobTitle === jobOpeningsList.find(j => j.id === compareJobId)?.title));
  const comparedCandidates = screenings.filter(s => selectedCompareIds.includes(s.id));

  const toggleCompareCandidate = (id: string) => {
    if (selectedCompareIds.includes(id)) {
      setSelectedCompareIds(selectedCompareIds.filter(item => item !== id));
    } else {
      if (selectedCompareIds.length >= 3) {
        alert("You can compare a maximum of 3 candidates side-by-side.");
        return;
      }
      setSelectedCompareIds([...selectedCompareIds, id]);
    }
  };

  // Candidate Career Portal filtered jobs
  const getFilteredCareerJobs = () => {
    return jobOpeningsList.filter(job => {
      const matchesCategory = candidateCategoryFilter === "all" || 
        job.title.toLowerCase().includes(candidateCategoryFilter.toLowerCase()) || 
        job.company.toLowerCase().includes(candidateCategoryFilter.toLowerCase()) ||
        job.description.toLowerCase().includes(candidateCategoryFilter.toLowerCase());

      const matchesSearch = !candidateSearchQuery.trim() || 
        job.title.toLowerCase().includes(candidateSearchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(candidateSearchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(candidateSearchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  };

  return (
    <div className="min-h-screen text-slate-900 font-sans antialiased selection:bg-blue-500 selection:text-white flex flex-col justify-between">
      
      {/* SOLID FROSTED APPLE NAVIGATION BAR (NO BACKGROUND TEXT OVERLAY) */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center justify-between">
            <div 
              className="cursor-pointer flex items-center gap-3 group"
              onClick={() => { setActiveTab("landing"); setSelectedScreeningId(null); }}
            >
              <div className="w-8 h-8 rounded-xl apple-blue-gradient flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  Clara AI <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">Pro</span>
                </h1>
                <p className="text-[10px] text-slate-500 font-medium">Enterprise Intelligence & Talent Assessment</p>
              </div>
            </div>

            {/* Mobile Mode Switcher */}
            <div className="md:hidden flex p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setPortalMode("recruiter")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${portalMode === "recruiter" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
              >
                Recruiter
              </button>
              <button
                onClick={() => setPortalMode("candidate")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${portalMode === "candidate" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"}`}
              >
                Careers
              </button>
            </div>
          </div>

          {/* Center: Apple-style Segmented Portal Controller (Desktop) */}
          <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-inner">
            <button
              onClick={() => { setPortalMode("recruiter"); setActiveTab("dashboard"); }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                portalMode === "recruiter" 
                  ? "bg-white text-slate-950 shadow-sm scale-100" 
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-600">
                <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 14.596a.75.75 0 011.06-1.06l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06zM5.404 5.404a.75.75 0 011.06-1.06l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06z" />
              </svg>
              Recruiter Workspace
            </button>

            <button
              onClick={() => { setPortalMode("candidate"); setCandidatePortalJob(null); }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                portalMode === "candidate" 
                  ? "bg-white text-blue-600 shadow-sm scale-100" 
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-600">
                <path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.132-1.745 2.53l-1.255.474v1.707a2.75 2.75 0 01-2.75 2.75h-4.5A2.75 2.75 0 015 15.25v-1.707l-1.255-.474A2.71 2.71 0 012 10.539V7.07c0-1.32.947-2.488 2.294-2.677.566-.078 1.134-.145 1.706-.2V3.75zm1.5.443v.15a44.6 44.6 0 015 0v-.15a1.25 1.25 0 00-1.25-1.25h-2.5A1.25 1.25 0 007.5 4.193z" clipRule="evenodd" />
              </svg>
              Candidate Careers
            </button>
          </div>

          {/* Right Navigation / Action Links */}
          {portalMode === "recruiter" ? (
            <nav className="flex items-center flex-wrap gap-1 sm:gap-2 text-xs font-semibold text-slate-600">
              <button 
                onClick={() => { setActiveTab("dashboard"); setSelectedScreeningId(null); }}
                className={`px-3 py-1.5 rounded-xl transition-all ${activeTab === "dashboard" ? "bg-white text-blue-600 shadow-sm" : "hover:text-slate-900"}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => { setActiveTab("screenings"); setSelectedScreeningId(null); }}
                className={`px-3 py-1.5 rounded-xl transition-all ${activeTab === "screenings" && !selectedScreeningId ? "bg-white text-blue-600 shadow-sm" : "hover:text-slate-900"}`}
              >
                Screenings
              </button>
              <button 
                onClick={() => { setActiveTab("compare"); setSelectedScreeningId(null); }}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${activeTab === "compare" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-blue-700 bg-blue-50 hover:bg-blue-100"}`}
              >
                <span>⚖️</span> Compare
              </button>
              <button 
                onClick={() => { setActiveTab("screen"); resetFormWorkflow(); }}
                className={`px-3 py-1.5 rounded-xl transition-all ${activeTab === "screen" ? "bg-white text-blue-600 shadow-sm" : "hover:text-slate-900"}`}
              >
                + New Screening
              </button>
              <button 
                onClick={() => { setActiveTab("jobs"); setSelectedScreeningId(null); }}
                className={`px-3 py-1.5 rounded-xl transition-all ${activeTab === "jobs" ? "bg-white text-blue-600 shadow-sm" : "hover:text-slate-900"}`}
              >
                Openings
              </button>
              <button 
                onClick={() => { setActiveTab("settings"); setSelectedScreeningId(null); }}
                className={`px-3 py-1.5 rounded-xl transition-all ${activeTab === "settings" ? "bg-white text-blue-600 shadow-sm" : "hover:text-slate-900"}`}
              >
                Settings
              </button>
            </nav>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">{jobOpeningsList.length} Active Openings</span>
              <button
                onClick={() => { setPortalMode("recruiter"); setActiveTab("dashboard"); }}
                className="text-xs font-semibold px-3.5 py-1.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-sm"
              >
                Recruiter Portal →
              </button>
            </div>
          )}

        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full">

        {/* ========================================================================= */}
        {/* PORTAL MODE 1: CANDIDATE CAREER PORTAL (PUBLIC FACING)                    */}
        {/* ========================================================================= */}
        {portalMode === "candidate" && (
          <div className="animate-fadeIn space-y-12">
            
            {/* Apple-style Hero Section */}
            <div className="relative text-center max-w-3xl mx-auto pt-6 pb-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700 shadow-sm mb-6 animate-scaleIn">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                We are actively hiring visionary talent
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-950 leading-tight">
                Build the Next Era of <br />
                <span className="apple-gradient-text">High-Impact Business</span>
              </h2>
              <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                Join our forward-thinking teams. Blend commercial acumen with ancient Indian ethos, solve complex challenges, and unleash your leadership potential.
              </p>

              {/* Search input for Candidate Careers */}
              <div className="mt-8 max-w-lg mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by role title, keyword, or company..."
                    value={candidateSearchQuery}
                    onChange={(e) => setCandidateSearchQuery(e.target.value)}
                    className="w-full px-5 py-3.5 bg-white rounded-2xl border border-slate-300 shadow-sm text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 pl-11"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400 absolute left-4 top-4">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Category Filters */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                {["all", "Founders Office", "Consulting", "Strategy", "Operations"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCandidateCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                      candidateCategoryFilter === cat
                        ? "bg-slate-900 text-white shadow-md shadow-slate-900/10 scale-105"
                        : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                    }`}
                  >
                    {cat === "all" ? "All Positions" : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Job Openings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredCareerJobs().length === 0 ? (
                <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-2">
                  <p className="text-sm font-semibold text-slate-800">No open requisitions match your search.</p>
                  <button
                    onClick={() => { setCandidateCategoryFilter("all"); setCandidateSearchQuery(""); }}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Reset filters and view all roles
                  </button>
                </div>
              ) : (
                getFilteredCareerJobs().map((job) => (
                  <div 
                    key={job.id} 
                    className="bg-white rounded-3xl p-7 flex flex-col justify-between border border-slate-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {job.company}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">Full-time • Hybrid</span>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-950">
                          {job.title}
                        </h3>
                        <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                          {job.description}
                        </p>
                      </div>

                      {/* Key Requirements Highlights */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Key Focus Areas</span>
                        <div className="flex flex-wrap gap-1.5">
                          {job.responsibilities.slice(0, 2).map((resp, i) => (
                            <span key={i} className="text-[10px] bg-slate-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-100">
                              {resp.length > 42 ? resp.slice(0, 42) + "..." : resp}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Tier-1 Package</span>
                      <button
                        onClick={() => {
                          setCandidatePortalJob(job);
                          setCandidateAppliedSuccess(false);
                          setCandidateFormErrors({});
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-600/20"
                      >
                        View Role & Apply →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PORTAL MODE 2: RECRUITER WORKSPACE & TABS                                 */}
        {/* ========================================================================= */}
        {portalMode === "recruiter" && (
          <div>

            {/* TAB: LANDING / WELCOME VIEW */}
            {activeTab === "landing" && (
              <div className="animate-fadeIn space-y-12">
                <div className="relative text-center max-w-3xl mx-auto pt-4 pb-6">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 mb-4">
                    Clara AI Enterprise 2.0
                  </span>
                  <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-950">
                    High-Fidelity Candidate <br />
                    <span className="apple-gradient-text">Screening & Intelligence</span>
                  </h2>
                  <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                    Transform your top-of-funnel hiring. Evaluate resumes against deep role competencies, uncover hidden gaps, and compare candidates side-by-side.
                  </p>
                  
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => setActiveTab("screen")}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                    >
                      + Start Candidate Screening
                    </button>
                    <button
                      onClick={() => setActiveTab("compare")}
                      className="px-6 py-3 bg-white hover:bg-slate-50 active:scale-95 text-slate-900 border border-slate-200 text-xs font-semibold rounded-xl shadow-sm transition-all"
                    >
                      ⚖️ Compare Candidates
                    </button>
                    <button
                      onClick={() => setActiveTab("dashboard")}
                      className="px-6 py-3 bg-white hover:bg-slate-50 active:scale-95 text-slate-900 border border-slate-200 text-xs font-semibold rounded-xl shadow-sm transition-all"
                    >
                      View Dashboard Metrics
                    </button>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-3xl p-7 space-y-3 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">
                      🎯
                    </div>
                    <h3 className="text-sm font-bold text-slate-950">Top-of-Funnel Triage</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Instantly score resumes against required competencies with zero subjective bias and 100% evidence-based rigor.
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl p-7 space-y-3 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-bold">
                      ⚖️
                    </div>
                    <h3 className="text-sm font-bold text-slate-950">Side-by-Side Comparison</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Compare 2 or 3 shortlisted candidates side-by-side to assess relative strengths, gap trade-offs, and final fit verdicts.
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl p-7 space-y-3 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">
                      📥
                    </div>
                    <h3 className="text-sm font-bold text-slate-950">Instant Resume Export</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Download formatted candidate resumes directly as Microsoft Word or text documents for executive team sign-offs.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: DASHBOARD */}
            {activeTab === "dashboard" && (
              <div className="animate-fadeIn space-y-8">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-950">Recruitment Dashboard</h2>
                  <p className="text-xs text-slate-500">Real-time candidate pipeline triage and evaluation summary.</p>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Screened</span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-950">{screenings.length}</span>
                      <span className="text-xs font-semibold text-emerald-600">Candidates</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Strong Matches (&gt;=85%)</span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-emerald-600">
                        {screenings.filter(s => s.matchScore >= 85).length}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Fast-track</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Open Job Requisitions</span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-blue-600">{jobOpeningsList.length}</span>
                      <span className="text-xs text-slate-500 font-medium">Active Roles</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Average Match Score</span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-950">
                        {screenings.length > 0 ? Math.round(screenings.reduce((acc, s) => acc + s.matchScore, 0) / screenings.length) : 0}%
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Benchmark</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Banner */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-200/90 shadow-sm">
                  <div className="space-y-1 text-center md:text-left">
                    <h3 className="text-base font-bold text-slate-950">Ready to compare shortlisted candidates?</h3>
                    <p className="text-xs text-slate-600">Select any role to compare 2 or 3 candidates side-by-side in real-time.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("compare")}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all shrink-0"
                  >
                    Open Side-by-Side Comparison →
                  </button>
                </div>
              </div>
            )}

            {/* TAB: SIDE-BY-SIDE CANDIDATE COMPARISON */}
            {activeTab === "compare" && (
              <div className="animate-fadeIn space-y-8">
                
                {/* Header & Role Selector */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-200/80 shadow-sm">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Decision Support Matrix</span>
                    <h2 className="text-2xl font-bold text-slate-950">Side-by-Side Candidate Comparison</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Select a target job opening and choose 2 or 3 candidates to compare.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">Target Role:</span>
                    <div className="relative">
                      <select
                        value={compareJobId}
                        onChange={(e) => setCompareJobId(e.target.value)}
                        className="appearance-none bg-white border border-slate-200/90 rounded-2xl pl-4 pr-10 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm hover:border-slate-300 transition-all cursor-pointer"
                      >
                        {jobOpeningsList.map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.title} — {job.company}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Candidate Selection Chips */}
                <div className="bg-white rounded-3xl p-6 space-y-4 border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Screened Candidates for this role ({compareMatchingScreenings.length})
                    </h3>
                    <span className="text-xs font-medium text-slate-500">
                      {selectedCompareIds.length} of 3 selected
                    </span>
                  </div>

                  {compareMatchingScreenings.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                      <p className="text-xs text-slate-500">No candidates screened for this position yet.</p>
                      <button
                        onClick={() => { setSelectedJobId(compareJobId); setActiveTab("screen"); }}
                        className="mt-3 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        + Screen a candidate for this role
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {compareMatchingScreenings.map((cand) => {
                        const isSelected = selectedCompareIds.includes(cand.id);
                        return (
                          <div
                            key={cand.id}
                            onClick={() => toggleCompareCandidate(cand.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? "bg-blue-50/80 border-blue-500 shadow-sm ring-2 ring-blue-500/20"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className={`w-3.5 h-3.5 rounded-md flex items-center justify-center text-[9px] font-bold ${
                                  isSelected ? "bg-blue-600 text-white" : "border border-slate-300"
                                }`}>
                                  {isSelected ? "✓" : ""}
                                </span>
                                <span className="text-xs font-bold text-slate-900">{cand.candidateName}</span>
                              </div>
                              <p className="text-[10px] text-slate-500">{cand.candidateEmail}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getScoreRating(cand.matchScore).color}`}>
                              {cand.matchScore}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* COMPARATIVE MATRIX TABLE */}
                {comparedCandidates.length >= 2 ? (
                  <div className="bg-white rounded-3xl p-6 sm:p-8 space-y-6 border border-slate-200/90 shadow-md">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                      <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                        <span>⚖️</span> Comparative Evaluation Matrix
                      </h3>
                      <span className="text-xs text-slate-500 font-medium">
                        Side-by-side analysis for {jobOpeningsList.find(j => j.id === compareJobId)?.title}
                      </span>
                    </div>

                    {/* Columns Grid */}
                    <div className={`grid grid-cols-1 md:grid-cols-${comparedCandidates.length} gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-200`}>
                      {comparedCandidates.map((cand, idx) => (
                        <div key={cand.id} className={`space-y-6 ${idx > 0 ? "pt-6 md:pt-0 md:pl-6" : ""}`}>
                          
                          {/* Candidate Header & Score */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Candidate {idx + 1}</span>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getScoreRating(cand.matchScore).color}`}>
                                {getScoreRating(cand.matchScore).text}
                              </span>
                            </div>

                            <h4 className="text-lg font-bold text-slate-950">{cand.candidateName}</h4>
                            <p className="text-xs text-slate-500">{cand.candidateLocation} • {cand.candidateAge} yrs</p>

                            {/* Progress bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-slate-600">Match Score</span>
                                <span className="text-slate-900 font-bold">{cand.matchScore}/100</span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${getScoreRating(cand.matchScore).bar} transition-all duration-500`} 
                                  style={{ width: `${cand.matchScore}%` }}
                                />
                              </div>
                            </div>

                            <button
                              onClick={() => handleDownloadResume(cand)}
                              className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-semibold rounded-xl transition-all"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                              </svg>
                              Download Resume
                            </button>
                          </div>

                          {/* Executive Fit Summary */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Executive Fit</span>
                            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                              {cand.overallFit}
                            </p>
                          </div>

                          {/* Strong Matches */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Key Strengths (✓)</span>
                            <ul className="space-y-2">
                              {cand.strongMatches.map((strength, i) => (
                                <li key={i} className="flex gap-2 text-xs text-slate-700">
                                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Gaps & Questions */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Key Gaps & Verification</span>
                            <div className="space-y-2">
                              {cand.gapsAndQuestions.map((item, i) => (
                                <div key={i} className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-xs space-y-1">
                                  <p className="text-slate-700 font-medium">{item.gap}</p>
                                  <p className="text-blue-700 font-semibold italic text-[11px]">"{item.question}"</p>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>

                  </div>
                ) : (
                  <div className="bg-white p-8 text-center rounded-3xl space-y-2 border border-slate-200">
                    <p className="text-sm font-semibold text-slate-800">Please select at least 2 candidates above</p>
                    <p className="text-xs text-slate-500">The side-by-side comparative matrix will automatically render once 2 or 3 candidates are checked.</p>
                  </div>
                )}

              </div>
            )}

            {/* TAB: SCREENINGS HISTORY VIEW & CANDIDATE DETAIL */}
            {activeTab === "screenings" && (
              <div className="animate-fadeIn">
                {activeScreening ? (
                  /* INDIVIDUAL CANDIDATE DETAIL REPORT */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setSelectedScreeningId(null)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        ← Back to all evaluation records
                      </button>
                      
                      {(activeScreening.resumeHtml || activeScreening.resumeText) && (
                        <button
                          onClick={() => handleDownloadResume(activeScreening)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-500/20"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                          </svg>
                          Download Resume
                        </button>
                      )}
                    </div>

                    {/* Screening Header Card */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-200/90 shadow-sm">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Candidate Evaluation Report</span>
                        <h2 className="text-2xl font-bold text-slate-950">{activeScreening.candidateName}</h2>
                        <p className="text-xs text-slate-600 font-medium">
                          Applied for <span className="font-semibold text-slate-900">{activeScreening.jobTitle}</span> at {activeScreening.jobCompany}
                        </p>
                        <span className="text-[10px] text-slate-400">Screened on {new Date(activeScreening.screenedAt).toLocaleDateString()}</span>
                      </div>

                      <div className="flex flex-col items-end">
                        <div className="text-4xl font-extrabold text-slate-950">{activeScreening.matchScore}<span className="text-sm font-medium text-slate-400">/100</span></div>
                        <span className={`text-[10px] px-3 py-1 mt-1.5 font-semibold rounded-full border ${getScoreRating(activeScreening.matchScore).color}`}>
                          {getScoreRating(activeScreening.matchScore).text}
                        </span>
                      </div>
                    </div>

                    {/* Report Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-7 space-y-6">
                        <div className="bg-white rounded-3xl p-6 space-y-3 border border-slate-200/80 shadow-sm">
                          <h3 className="text-sm font-bold text-slate-950 border-b border-slate-100 pb-2">Overall Fit</h3>
                          <p className="text-xs text-slate-700 leading-relaxed font-normal">{activeScreening.overallFit}</p>
                        </div>

                        <div className="bg-white rounded-3xl p-6 space-y-3 border border-slate-200/80 shadow-sm">
                          <h3 className="text-sm font-bold text-slate-950 border-b border-slate-100 pb-2">Strong Matches (✓)</h3>
                          {activeScreening.strongMatches && activeScreening.strongMatches.length > 0 ? (
                            <ul className="space-y-3">
                              {activeScreening.strongMatches.map((strength, index) => (
                                <li key={index} className="flex gap-2.5 text-xs text-slate-700 leading-relaxed">
                                  <span className="text-emerald-500 font-semibold shrink-0">✓</span>
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-500 italic">No significant matching requirements found in the resume.</p>
                          )}
                        </div>
                      </div>

                      <div className="md:col-span-5 space-y-6">
                        <div className="bg-white rounded-3xl p-6 space-y-3 border border-slate-200/80 shadow-sm">
                          <h3 className="text-sm font-bold text-slate-950 border-b border-slate-100 pb-2">Candidate Profile</h3>
                          <div className="text-xs space-y-2">
                            <div className="flex justify-between py-1 border-b border-slate-50">
                              <span className="text-slate-400">Email</span>
                              <span className="font-medium text-slate-900">{activeScreening.candidateEmail}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-50">
                              <span className="text-slate-400">Phone</span>
                              <span className="font-medium text-slate-900">{activeScreening.candidatePhone}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-50">
                              <span className="text-slate-400">Location</span>
                              <span className="font-medium text-slate-900">{activeScreening.candidateLocation}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-50">
                              <span className="text-slate-400">Age</span>
                              <span className="font-medium text-slate-900">{activeScreening.candidateAge} years old</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 space-y-3 border border-slate-200/80 shadow-sm">
                          <h3 className="text-sm font-bold text-slate-950 border-b border-slate-100 pb-2">Gaps & Interview Questions</h3>
                          {activeScreening.gapsAndQuestions && activeScreening.gapsAndQuestions.length > 0 ? (
                            <div className="space-y-4 divide-y divide-slate-100">
                              {activeScreening.gapsAndQuestions.map((item, index) => (
                                <div key={index} className={`space-y-1.5 ${index > 0 ? "pt-3" : ""}`}>
                                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Gap / Uncertainty</span>
                                  <p className="text-xs text-slate-700">{item.gap}</p>
                                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs">
                                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block">Ask in Interview</span>
                                    <p className="font-semibold text-slate-900 italic mt-0.5">"{item.question}"</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic">No significant gaps detected.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* EVALUATION RECORDS TABLE */
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-950">Evaluation Records</h2>
                        <p className="text-xs text-slate-500">History of all candidate screenings performed.</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setActiveTab("compare")}
                          className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-xl transition-all border border-blue-100"
                        >
                          ⚖️ Compare Selected
                        </button>
                      </div>
                    </div>

                    {/* Filter controls */}
                    <div className="bg-white rounded-3xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between border border-slate-200/80 shadow-sm">
                      <input
                        type="text"
                        placeholder="Search candidate or job role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-72 px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs outline-none focus:border-blue-500"
                      />

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                          <select 
                            value={filterJobId}
                            onChange={(e) => setFilterJobId(e.target.value)}
                            className="appearance-none bg-white border border-slate-200/90 rounded-2xl pl-4 pr-10 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm hover:border-slate-300 transition-all cursor-pointer"
                          >
                            <option value="all">All openings</option>
                            {jobOpeningsList.map(job => (
                              <option key={job.id} value={job.id}>{job.title}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>

                        <div className="relative">
                          <select 
                            value={filterFit}
                            onChange={(e) => setFilterFit(e.target.value)}
                            className="appearance-none bg-white border border-slate-200/90 rounded-2xl pl-4 pr-10 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm hover:border-slate-300 transition-all cursor-pointer"
                          >
                            <option value="all">All match tiers</option>
                            <option value="strong">Strong match (&gt;= 85)</option>
                            <option value="good">Good fit (70-84)</option>
                            <option value="moderate">Moderate fit (50-69)</option>
                            <option value="weak">Weak fit (&lt; 50)</option>
                          </select>
                          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[9px] font-bold">
                            <th className="px-6 py-3.5">Candidate</th>
                            <th className="px-6 py-3.5">Applied Position</th>
                            <th className="px-6 py-3.5">Match Score</th>
                            <th className="px-6 py-3.5">Screening Date</th>
                            <th className="px-6 py-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {getFilteredScreenings().length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                No evaluation records match your filter criteria.
                              </td>
                            </tr>
                          ) : (
                            getFilteredScreenings().map((s) => (
                              <tr 
                                key={s.id} 
                                onClick={() => setSelectedScreeningId(s.id)}
                                className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                              >
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{s.candidateName}</span>
                                    <span className="text-[10px] text-slate-400">{s.candidateEmail}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-slate-800">{s.jobTitle}</span>
                                    <span className="text-[10px] text-slate-400">{s.jobCompany}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getScoreRating(s.matchScore).color}`}>
                                    {s.matchScore}%
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                  {new Date(s.screenedAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  {(s.resumeHtml || s.resumeText) && (
                                    <button
                                      onClick={() => handleDownloadResume(s)}
                                      className="text-slate-600 hover:text-blue-600 mr-4 font-semibold inline-flex items-center gap-1"
                                      title="Download resume"
                                    >
                                      Download
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => setSelectedScreeningId(s.id)}
                                    className="text-blue-600 hover:underline mr-4 font-semibold"
                                  >
                                    Review
                                  </button>
                                  <button 
                                    onClick={(e) => triggerDeleteScreening(s.id, e)}
                                    className="text-rose-500 hover:text-rose-700 font-semibold"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* TAB: SCREEN CANDIDATE (FORM WORKFLOW) */}
            {activeTab === "screen" && (
              <div className="mx-auto max-w-2xl animate-fadeIn space-y-8">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-950">Screen a Candidate</h2>
                  <p className="text-xs text-slate-500">Run an objective, evidence-based AI assessment against role requirements.</p>
                </div>

                {/* Stepper Header */}
                <div className="bg-white p-4 rounded-3xl flex items-center justify-between text-xs font-semibold border border-slate-200/80 shadow-sm">
                  <span className={`px-3 py-1 rounded-xl ${formStep === "form" ? "bg-blue-600 text-white" : "text-slate-600"}`}>1. Input Details</span>
                  <span>→</span>
                  <span className={`px-3 py-1 rounded-xl ${formStep === "review" ? "bg-blue-600 text-white" : "text-slate-600"}`}>2. Verify & Review</span>
                  <span>→</span>
                  <span className={`px-3 py-1 rounded-xl ${formStep === "screening" ? "bg-blue-600 text-white" : "text-slate-600"}`}>3. AI Analysis</span>
                </div>

                {formStep === "form" && (
                  <form onSubmit={handleReviewStep} className="bg-white p-6 sm:p-8 rounded-3xl space-y-5 border border-slate-200/90 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Candidate Full Name <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleFormChange}
                          placeholder="e.g. Rohan Kapoor"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none bg-white transition-all ${
                            formErrors.name ? "border-rose-500 bg-rose-50/30" : "border-slate-300 focus:border-blue-500"
                          }`}
                        />
                        {formErrors.name && <p className="text-[10px] text-rose-500 font-medium mt-1">{formErrors.name}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Email Address <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleFormChange}
                          placeholder="rohan.kapoor@example.com"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none bg-white transition-all ${
                            formErrors.email ? "border-rose-500 bg-rose-50/30" : "border-slate-300 focus:border-blue-500"
                          }`}
                        />
                        {formErrors.email && <p className="text-[10px] text-rose-500 font-medium mt-1">{formErrors.email}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Phone Number (Digits only) <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleFormChange}
                          placeholder="+91 98200 11223"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none bg-white transition-all ${
                            formErrors.phone ? "border-rose-500 bg-rose-50/30" : "border-slate-300 focus:border-blue-500"
                          }`}
                        />
                        {formErrors.phone && <p className="text-[10px] text-rose-500 font-medium mt-1">{formErrors.phone}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Current Location <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          name="currentLocation"
                          value={form.currentLocation}
                          onChange={handleFormChange}
                          placeholder="e.g. Mumbai / Bengaluru"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none bg-white transition-all ${
                            formErrors.location ? "border-rose-500 bg-rose-50/30" : "border-slate-300 focus:border-blue-500"
                          }`}
                        />
                        {formErrors.location && <p className="text-[10px] text-rose-500 font-medium mt-1">{formErrors.location}</p>}
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Target Job Opening <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={selectedJobId}
                            onChange={(e) => {
                              setSelectedJobId(e.target.value);
                              if (formErrors.jobId) setFormErrors((prev) => ({ ...prev, jobId: undefined }));
                            }}
                            className={`w-full appearance-none bg-white border rounded-2xl pl-4 pr-10 py-2.5 text-xs font-semibold text-slate-800 outline-none transition-all cursor-pointer shadow-sm ${
                              formErrors.jobId ? "border-rose-500 bg-rose-50/30" : "border-slate-200/90 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            }`}
                          >
                            <option value="">Select a target role...</option>
                            {jobOpeningsList.map((job) => (
                              <option key={job.id} value={job.id}>
                                {job.title} — {job.company}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        {formErrors.jobId && <p className="text-[10px] text-rose-500 font-medium mt-1">{formErrors.jobId}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Candidate Age (18–99) <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="number"
                          min="18"
                          max="99"
                          name="age"
                          value={form.age}
                          onChange={handleFormChange}
                          placeholder="e.g. 25"
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none bg-white transition-all ${
                            formErrors.age ? "border-rose-500 bg-rose-50/30" : "border-slate-300 focus:border-blue-500"
                          }`}
                        />
                        {formErrors.age && <p className="text-[10px] text-rose-500 font-medium mt-1">{formErrors.age}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Full Postal Address
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={form.address}
                          onChange={handleFormChange}
                          placeholder="Optional residential address"
                          className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 text-xs outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Resume File Upload */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Upload Candidate Resume (.docx format) <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <div className={`p-6 rounded-2xl border-2 border-dashed transition-colors text-center relative cursor-pointer ${
                        formErrors.file ? "border-rose-400 bg-rose-50/20" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                      }`}>
                        <input
                          type="file"
                          accept=".docx"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-800">
                            {resumeFile ? `Selected: ${resumeFile.name}` : "Click or drag & drop .docx resume file here"}
                          </p>
                          <p className="text-[10px] text-slate-500">Microsoft Word document (.docx) up to 5MB</p>
                        </div>
                      </div>
                      {formErrors.file && <p className="text-xs text-rose-500 font-medium mt-1.5">{formErrors.file}</p>}
                    </div>

                    <div className="pt-3 flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                      >
                        Proceed to Review →
                      </button>
                    </div>
                  </form>
                )}

                {formStep === "review" && (
                  <div className="bg-white p-6 sm:p-8 rounded-3xl space-y-6 border border-slate-200/90 shadow-sm">
                    <h3 className="text-base font-bold text-slate-950">Review Candidate Details</h3>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2">
                      <div className="flex justify-between"><span className="text-slate-500">Name:</span> <span className="font-semibold text-slate-900">{form.name}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Email:</span> <span className="font-semibold text-slate-900">{form.email}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Phone:</span> <span className="font-semibold text-slate-900">{form.phone}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Location:</span> <span className="font-semibold text-slate-900">{form.currentLocation}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Target Role:</span> <span className="font-semibold text-blue-600">{jobOpeningsList.find(j => j.id === selectedJobId)?.title}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Resume File:</span> <span className="font-semibold text-slate-900">{resumeFile?.name}</span></div>
                    </div>

                    {apiError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                        ⚠️ {apiError}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setFormStep("form")}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        ← Edit Details
                      </button>

                      <button
                        type="button"
                        onClick={handleInitiateScreening}
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                      >
                        {isLoading ? "Running AI Evaluation..." : "Initiate AI Screening →"}
                      </button>
                    </div>
                  </div>
                )}

                {formStep === "screening" && (
                  <div className="bg-white p-12 text-center rounded-3xl space-y-4 border border-slate-200/90 shadow-sm animate-scaleIn">
                    <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <h3 className="text-base font-bold text-slate-900">Evaluating Candidate Experience</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Comparing resume evidence against target competencies, extracting strengths, and drafting recruiter interview questions...
                    </p>
                  </div>
                )}

              </div>
            )}

            {/* TAB: JOB OPENINGS */}
            {activeTab === "jobs" && (
              <div className="animate-fadeIn space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-950">Job Requisitions</h2>
                    <p className="text-xs text-slate-500">Active role openings and assessment rubrics.</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowAddJobForm(!showAddJobForm);
                      setJobFormErrors({});
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all"
                  >
                    {showAddJobForm ? "✕ Cancel" : "+ Create New Opening"}
                  </button>
                </div>

                {showAddJobForm && (
                  <form onSubmit={handleAddJobOpening} className="bg-white p-6 sm:p-8 rounded-3xl space-y-4 border border-slate-200/90 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-950">Create New Job Position</h3>
                    
                    {jobApiError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                        ⚠️ {jobApiError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Position Title <span className="text-rose-500 font-bold">*</span></label>
                        <input
                          type="text"
                          value={jobForm.title}
                          onChange={(e) => {
                            setJobForm({...jobForm, title: e.target.value});
                            if (jobFormErrors.title) setJobFormErrors({...jobFormErrors, title: undefined});
                          }}
                          placeholder="e.g. Chief of Staff / Product Manager"
                          className={`w-full px-3.5 py-2.5 bg-white rounded-xl border text-xs outline-none transition-all ${
                            jobFormErrors.title ? "border-rose-500 bg-rose-50/30" : "border-slate-300 focus:border-blue-500"
                          }`}
                        />
                        {jobFormErrors.title && <p className="text-[10px] text-rose-500 font-medium mt-1">{jobFormErrors.title}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name <span className="text-rose-500 font-bold">*</span></label>
                        <input
                          type="text"
                          value={jobForm.company}
                          onChange={(e) => {
                            setJobForm({...jobForm, company: e.target.value});
                            if (jobFormErrors.company) setJobFormErrors({...jobFormErrors, company: undefined});
                          }}
                          placeholder="e.g. Satva Partners"
                          className={`w-full px-3.5 py-2.5 bg-white rounded-xl border text-xs outline-none transition-all ${
                            jobFormErrors.company ? "border-rose-500 bg-rose-50/30" : "border-slate-300 focus:border-blue-500"
                          }`}
                        />
                        {jobFormErrors.company && <p className="text-[10px] text-rose-500 font-medium mt-1">{jobFormErrors.company}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Role Description <span className="text-rose-500 font-bold">*</span></label>
                      <textarea
                        rows={3}
                        value={jobForm.description}
                        onChange={(e) => {
                          setJobForm({...jobForm, description: e.target.value});
                          if (jobFormErrors.description) setJobFormErrors({...jobFormErrors, description: undefined});
                        }}
                        placeholder="Detailed role description and mission context..."
                        className={`w-full px-3.5 py-2.5 bg-white rounded-xl border text-xs outline-none transition-all ${
                          jobFormErrors.description ? "border-rose-500 bg-rose-50/30" : "border-slate-300 focus:border-blue-500"
                        }`}
                      />
                      {jobFormErrors.description && <p className="text-[10px] text-rose-500 font-medium mt-1">{jobFormErrors.description}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Key Responsibilities (One per line)</label>
                      <textarea
                        rows={3}
                        value={jobForm.responsibilitiesText}
                        onChange={(e) => setJobForm({...jobForm, responsibilitiesText: e.target.value})}
                        placeholder="Support quantitative data analysis&#10;Executive PowerPoint presentations&#10;Lead project mobilization"
                        className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 text-xs outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={isJobLoading}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
                      >
                        {isJobLoading ? "Saving..." : "Save Job Opening"}
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {jobOpeningsList.map((job) => (
                    <div key={job.id} className="bg-white rounded-3xl p-6 space-y-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {job.company}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 font-semibold">
                            {screenings.filter(s => s.jobId === job.id || s.jobTitle === job.title).length} Screened
                          </span>
                          <button
                            onClick={() => handleOpenEditJob(job)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors text-xs font-semibold"
                            title="Edit job opening"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={(e) => triggerDeleteJobOpening(job.id, e)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors text-xs font-semibold"
                            title="Delete job opening"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-950">{job.title}</h3>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{job.description}</p>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => { setSelectedJobId(job.id); setActiveTab("screen"); }}
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          + Screen Candidate →
                        </button>
                        <button
                          onClick={() => { setCompareJobId(job.id); setActiveTab("compare"); }}
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                        >
                          ⚖️ Compare
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: GLOBAL CANDIDATES */}
            {activeTab === "candidates" && (
              <div className="animate-fadeIn space-y-8">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-950">Candidate Talent Directory</h2>
                  <p className="text-xs text-slate-500">Unique candidate profiles and their cross-role screening records.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getGlobalCandidates().map((cand, idx) => (
                    <div key={idx} className="bg-white rounded-3xl p-6 space-y-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                          {cand.name.charAt(0)}
                        </div>
                        <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {cand.applicationsCount} Evaluation{cand.applicationsCount > 1 ? "s" : ""}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-950">{cand.name}</h3>
                        <p className="text-xs text-slate-500">{cand.email}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{cand.location} • {cand.phone}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">{cand.latestRole}</span>
                        <span className="font-bold text-slate-900">{cand.latestScore}% Fit</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: SETTINGS */}
            {activeTab === "settings" && (
              <div className="mx-auto max-w-2xl animate-fadeIn space-y-8">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-950">Settings & Intelligence Engine</h2>
                  <p className="text-xs text-slate-500">Manage LLM configurations, custom API keys, and system diagnostics.</p>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-3xl space-y-6 border border-slate-200/90 shadow-sm">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-950">Custom Personal API Key (Optional)</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Override server environment variables with a personal API key stored directly in your browser's local storage.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-700">
                      API Key (Groq `gsk_...` or Gemini `AIzaSy...`)
                    </label>
                    <input
                      type="password"
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      placeholder="Paste your personal API key here..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 text-xs outline-none focus:border-blue-500"
                    />
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={handleSaveApiKey}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
                      >
                        Save API Key
                      </button>
                      {tempApiKey && (
                        <button
                          onClick={() => { setTempApiKey(""); localStorage.removeItem("clara_custom_api_key"); alert("Cleared custom key."); }}
                          className="text-xs text-rose-500 hover:underline font-semibold"
                        >
                          Clear Key
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 text-xs space-y-2 text-slate-500">
                    <p className="font-semibold text-slate-800">Supported AI Engine Providers:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong>Groq</strong> (Ultra-fast inference with dynamic model resolution)</li>
                      <li><strong>Google Gemini</strong> (gemini-1.5-flash high context fallback)</li>
                      <li><strong>PostgreSQL Database</strong> (Neon serverless cloud persistence)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* APPLE-INSPIRED TRANSLUCENT FOOTER */}
      <footer className="mt-16 border-t border-slate-200 bg-white/90 backdrop-blur-md py-8 text-center text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Clara AI Platform. Precision Talent Intelligence.</p>
          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <span>Serverless Neon DB</span>
            <span>•</span>
            <span>Dual LLM Engine</span>
            <span>•</span>
            <span>Glassmorphic Apple Design</span>
          </div>
        </div>
      </footer>

      {/* TOP-LEVEL CANDIDATE ROLE & APPLICATION MODAL (ESCAPE STACKING CONTEXTS, COVERS EVERYTHING) */}
      {candidatePortalJob && (
        <div 
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCandidatePortalJob(null);
          }}
        >
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-[0_25px_90px_rgba(0,0,0,0.6)] border border-slate-200 max-h-[88vh] flex flex-col overflow-hidden my-auto relative">
            
            {/* Modal Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div>
                <span className="text-xs font-bold text-blue-600">{candidatePortalJob.company}</span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-950">{candidatePortalJob.title}</h2>
              </div>
              <button 
                onClick={() => setCandidatePortalJob(null)}
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 font-bold transition-colors shadow-sm"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white">
              {candidateAppliedSuccess ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                    ✓
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Application Submitted!</h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    Thank you for applying for the <span className="font-semibold text-slate-900">{candidatePortalJob.title}</span> position at {candidatePortalJob.company}. Our recruitment intelligence system has received your profile.
                  </p>
                  <button
                    onClick={() => setCandidatePortalJob(null)}
                    className="mt-4 px-6 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-md"
                  >
                    Browse Other Openings
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column: Role Details & Requirements */}
                  <div className="lg:col-span-5 space-y-6 lg:border-r lg:border-slate-100 lg:pr-6">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">About the Role</h4>
                      <p className="text-xs text-slate-700 leading-relaxed font-normal bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        {candidatePortalJob.description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Key Responsibilities</h4>
                      <ul className="space-y-2">
                        {candidatePortalJob.responsibilities.map((item, idx) => (
                          <li key={idx} className="flex gap-2 text-xs text-slate-700 items-start">
                            <span className="text-blue-500 font-bold shrink-0">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-1">
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Hiring Process</span>
                      <p className="text-[11px] text-slate-600">
                        Applications are screened by Clara AI within 24 hours. Top matches are fast-tracked directly to partner interview rounds.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Application Form */}
                  <div className="lg:col-span-7 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-bold text-slate-950">Candidate Application Form</h3>
                      <span className="text-[10px] text-slate-400 font-medium">* Required fields</span>
                    </div>

                    <form onSubmit={handleCandidatePortalApply} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Full Name <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={candidateForm.name}
                            onChange={handleCandidateFormChange}
                            placeholder="e.g. Rohan Kapoor"
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none bg-white transition-all ${
                              candidateFormErrors.name ? "border-rose-500 bg-rose-50/30" : "border-slate-300 focus:border-blue-500"
                            }`}
                          />
                          {candidateFormErrors.name && (
                            <p className="text-[10px] text-rose-500 font-medium mt-1">{candidateFormErrors.name}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Email Address <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={candidateForm.email}
                            onChange={handleCandidateFormChange}
                            placeholder="rohan.kapoor@example.com"
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none bg-white transition-all ${
                              candidateFormErrors.email ? "border-rose-500 bg-rose-50/30" : "border-slate-300 focus:border-blue-500"
                            }`}
                          />
                          {candidateFormErrors.email && (
                            <p className="text-[10px] text-rose-500 font-medium mt-1">{candidateFormErrors.email}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Phone Number (Digits only) <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={candidateForm.phone}
                            onChange={handleCandidateFormChange}
                            placeholder="+91 98200 11223"
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none bg-white transition-all ${
                              candidateFormErrors.phone ? "border-rose-500 bg-rose-50/30" : "border-slate-300 focus:border-blue-500"
                            }`}
                          />
                          {candidateFormErrors.phone && (
                            <p className="text-[10px] text-rose-500 font-medium mt-1">{candidateFormErrors.phone}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Current City <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            name="currentLocation"
                            value={candidateForm.currentLocation}
                            onChange={handleCandidateFormChange}
                            placeholder="e.g. Mumbai / Bengaluru"
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none bg-white transition-all ${
                              candidateFormErrors.location ? "border-rose-500 bg-rose-50/30" : "border-slate-300 focus:border-blue-500"
                            }`}
                          />
                          {candidateFormErrors.location && (
                            <p className="text-[10px] text-rose-500 font-medium mt-1">{candidateFormErrors.location}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Age (18–99) <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input
                            type="number"
                            min="18"
                            max="99"
                            name="age"
                            value={candidateForm.age}
                            onChange={handleCandidateFormChange}
                            placeholder="e.g. 24"
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none bg-white transition-all ${
                              candidateFormErrors.age ? "border-rose-500 bg-rose-50/30" : "border-slate-300 focus:border-blue-500"
                            }`}
                          />
                          {candidateFormErrors.age && (
                            <p className="text-[10px] text-rose-500 font-medium mt-1">{candidateFormErrors.age}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Residential Address
                          </label>
                          <input
                            type="text"
                            name="address"
                            value={candidateForm.address}
                            onChange={handleCandidateFormChange}
                            placeholder="Optional address details"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-blue-500 bg-white"
                          />
                        </div>
                      </div>

                      {/* Resume Upload Box */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Upload Resume (.docx format) <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <div className={`p-5 rounded-2xl border-2 border-dashed transition-colors text-center cursor-pointer relative ${
                          candidateFormErrors.file ? "border-rose-400 bg-rose-50/20" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                        }`}>
                          <input
                            type="file"
                            accept=".docx"
                            ref={candidateFileInputRef}
                            onChange={handleCandidateFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-800">
                              {candidateResumeFile ? `Selected: ${candidateResumeFile.name}` : "Click or drag & drop your .docx resume here"}
                            </p>
                            <p className="text-[10px] text-slate-500">Microsoft Word (.docx) format up to 5MB</p>
                          </div>
                        </div>
                        {candidateFormErrors.file && (
                          <p className="text-[10px] text-rose-500 font-medium mt-1.5">{candidateFormErrors.file}</p>
                        )}
                      </div>

                      <div className="pt-3 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setCandidatePortalJob(null)}
                          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={candidateApplying}
                          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
                        >
                          {candidateApplying ? "Analyzing & Submitting..." : "Submit Application →"}
                        </button>
                      </div>
                    </form>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* EDIT JOB OPENING MODAL (ROOT DOM LEVEL WITH Z-9999) */}
      {editingJob && (
        <div 
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingJob(null);
          }}
        >
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-[0_25px_90px_rgba(0,0,0,0.6)] border border-slate-200 max-h-[88vh] flex flex-col overflow-hidden my-auto relative">
            
            {/* Modal Header */}
            <div className="px-6 sm:px-8 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div>
                <span className="text-xs font-bold text-blue-600">Edit Position</span>
                <h2 className="text-xl font-bold text-slate-950">{editingJob.title}</h2>
              </div>
              <button 
                onClick={() => setEditingJob(null)}
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 font-bold transition-colors shadow-sm"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white">
              <form onSubmit={handleUpdateJobOpening} className="space-y-4">
                {editJobApiError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                    ⚠️ {editJobApiError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Position Title <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={editJobForm.title}
                      onChange={(e) => {
                        setEditJobForm({ ...editJobForm, title: e.target.value });
                        if (editJobFormErrors.title) setEditJobFormErrors({ ...editJobFormErrors, title: undefined });
                      }}
                      className={`w-full px-3.5 py-2.5 bg-white rounded-xl border text-xs outline-none transition-all ${
                        editJobFormErrors.title ? "border-rose-500 bg-rose-50/30" : "border-slate-300 focus:border-blue-500"
                      }`}
                    />
                    {editJobFormErrors.title && <p className="text-[10px] text-rose-500 font-medium mt-1">{editJobFormErrors.title}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Company Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={editJobForm.company}
                      onChange={(e) => {
                        setEditJobForm({ ...editJobForm, company: e.target.value });
                        if (editJobFormErrors.company) setEditJobFormErrors({ ...editJobFormErrors, company: undefined });
                      }}
                      className={`w-full px-3.5 py-2.5 bg-white rounded-xl border text-xs outline-none transition-all ${
                        editJobFormErrors.company ? "border-rose-500 bg-rose-50/30" : "border-slate-300 focus:border-blue-500"
                      }`}
                    />
                    {editJobFormErrors.company && <p className="text-[10px] text-rose-500 font-medium mt-1">{editJobFormErrors.company}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role Description <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={editJobForm.description}
                    onChange={(e) => {
                      setEditJobForm({ ...editJobForm, description: e.target.value });
                      if (editJobFormErrors.description) setEditJobFormErrors({ ...editJobFormErrors, description: undefined });
                    }}
                    className={`w-full px-3.5 py-2.5 bg-white rounded-xl border text-xs outline-none transition-all ${
                      editJobFormErrors.description ? "border-rose-500 bg-rose-50/30" : "border-slate-300 focus:border-blue-500"
                    }`}
                  />
                  {editJobFormErrors.description && <p className="text-[10px] text-rose-500 font-medium mt-1">{editJobFormErrors.description}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Key Responsibilities (One per line)</label>
                  <textarea
                    rows={3}
                    value={editJobForm.responsibilitiesText}
                    onChange={(e) => setEditJobForm({ ...editJobForm, responsibilitiesText: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Required Skills (One per line)</label>
                  <textarea
                    rows={2}
                    value={editJobForm.skillsText}
                    onChange={(e) => setEditJobForm({ ...editJobForm, skillsText: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 text-xs outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      if (editingJob) triggerDeleteJobOpening(editingJob.id, e);
                      setEditingJob(null);
                    }}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                  >
                    Delete Position
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingJob(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isEditJobLoading}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
                    >
                      {isEditJobLoading ? "Updating..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* APPLE-STYLE DELETE CONFIRMATION DIALOG MODAL (Z-99999) */}
      {deleteConfirmState && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[99999] flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setDeleteConfirmState(null)}
        >
          <div 
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-[0_25px_90px_rgba(0,0,0,0.6)] border border-slate-200 text-center space-y-4 animate-scaleIn my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-2xl shadow-inner border border-rose-100">
              🗑️
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-950">{deleteConfirmState.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {deleteConfirmState.subtitle}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmState(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-semibold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-600/25 transition-all"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPLE-STYLE FLOATING TOAST NOTIFICATION */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-[999999] animate-scaleIn">
          <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{toastNotification}</span>
          </div>
        </div>
      )}

    </div>
  );
}
