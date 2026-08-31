"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { jobOpenings as defaultJobOpenings, JobOpening } from "@/data/jobs";

interface GapQuestion {
  gap: string;
  question: string;
}

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
  gapsAndQuestions: GapQuestion[];
  screenedAt: string;
  warning?: string;
}

interface CandidateForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  age: string;
  currentLocation: string;
}

interface JobForm {
  title: string;
  company: string;
  description: string;
  responsibilitiesText: string;
  skillsText: string;
  experienceText: string;
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
  skillsText: "",
  experienceText: ""
};

// 3 Mock screenings to pre-populate the dashboard if localstorage is empty
const defaultMockScreenings: SavedScreening[] = [
  {
    id: "scr-1",
    candidateName: "Rahul Sharma",
    candidateEmail: "rahul.sharma@example.com",
    candidatePhone: "+91 98765 43210",
    candidateAddress: "Sector 15, Gurgaon, Haryana",
    candidateAge: 25,
    candidateLocation: "Delhi NCR",
    jobId: "opening-a",
    jobTitle: "Founders Office Associate",
    jobCompany: "Satva Partners",
    matchScore: 88,
    overallFit: "Rahul is an outstanding fit for the Founders Office Associate role. He brings 3 years of consulting experience from EY, showcasing strategic problem-solving and executive-ready communication. He has advanced Excel modeling credentials and a proven track record of coordinating with leadership stakeholders.",
    strongMatches: [
      "3 years of management consulting experience at EY, aligning with the strategic problem-solving requirement.",
      "Expert-level Excel financial modeling certifications and experience building automated executive dashboards.",
      "Direct experience managing executive relationships and presenting weekly board decks."
    ],
    gapsAndQuestions: [
      {
        gap: "Limited experience with early-stage venture building metrics compared to corporate finance.",
        question: "How would you adapt your financial analysis approach from structured corporate projects to high-ambiguity startup models?"
      }
    ],
    screenedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  },
  {
    id: "scr-2",
    candidateName: "Aditi Patel",
    candidateEmail: "aditi.patel@example.com",
    candidatePhone: "+91 87654 32109",
    candidateAddress: "Bandra West, Mumbai, Maharashtra",
    candidateAge: 24,
    candidateLocation: "Mumbai",
    jobId: "opening-b",
    jobTitle: "Content & Communities Lead",
    jobCompany: "House of Ved",
    matchScore: 74,
    overallFit: "Aditi shows strong potential for the Content & Communities Lead position. She has 2 years of social media management experience at a lifestyle agency, producing high-engagement vertical video content. Her copywriting is creative and polished, though she has limited direct community forum management experience.",
    strongMatches: [
      "2 years of social media creation, showing strong alignment with visual storytelling and vertical video (Reels/TikTok).",
      "Proficient in Adobe Suite and Canva, matching the creative design requirement.",
      "Creative writing portfolio showcasing brand tone consistency across digital newsletters."
    ],
    gapsAndQuestions: [
      {
        gap: "No explicit experience managing Discord, Slack, or Circle community groups.",
        question: "Can you describe your strategy for keeping community members engaged and active in a structured forum environment?"
      }
    ],
    screenedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
  },
  {
    id: "scr-3",
    candidateName: "Priyank Nandawat",
    candidateEmail: "priyank@example.com",
    candidatePhone: "+91 99999 88888",
    candidateAddress: "Mansarovar, Jaipur, Rajasthan",
    candidateAge: 22,
    candidateLocation: "Jaipur",
    jobId: "opening-a",
    jobTitle: "Founders Office Associate",
    jobCompany: "Satva Partners",
    matchScore: 10,
    overallFit: "Priyank's resume shows experience as a Salesforce Developer trainee, but the role of Founders Office Associate requires 2-3 years of corporate experience in a Tier-1 organization, strategic problem-solving, data analysis, Excel/PowerPoint proficiency, and executive-level communication—all of which are not evidenced in the provided resume. Consequently, the candidate does not align well with the core responsibilities.",
    strongMatches: [],
    gapsAndQuestions: [
      {
        gap: "No evidence of communication with senior executives or presenting to them.",
        question: "Have you presented findings or recommendations to senior leadership in any capacity? If yes, describe the context and outcome."
      }
    ],
    screenedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
  }
];

export default function ClaraAiPlatform() {
  // Navigation: 'dashboard' | 'screenings' | 'screen' | 'jobs' | 'candidates' | 'settings'
  const [activeTab, setActiveTab] = useState<"dashboard" | "screenings" | "screen" | "jobs" | "candidates" | "settings">("dashboard");
  const [screenings, setScreenings] = useState<SavedScreening[]>([]);
  const [jobOpeningsList, setJobOpeningsList] = useState<JobOpening[]>(defaultJobOpenings);
  const [selectedScreeningId, setSelectedScreeningId] = useState<string | null>(null);

  // New Screening Form Workflow States: 'form' | 'review' | 'screening'
  const [formStep, setFormStep] = useState<"form" | "review" | "screening">("form");
  const [form, setForm] = useState<CandidateForm>(initialForm);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Job Opening Form workflow
  const [jobForm, setJobForm] = useState<JobForm>(initialJobForm);
  const [showAddJobForm, setShowAddJobForm] = useState<boolean>(false);
  const [jobApiError, setJobApiError] = useState<string | null>(null);
  const [isJobLoading, setIsJobLoading] = useState<boolean>(false);

  // Settings states
  const [tempApiKey, setTempApiKey] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter states for Screenings table
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterJobId, setFilterJobId] = useState<string>("all");
  const [filterFit, setFilterFit] = useState<string>("all");

  // Load database jobs and screenings on mount (with localStorage fallback)
  useEffect(() => {
    async function loadData() {
      // 1. Fetch dynamic job openings
      try {
        const jobsRes = await fetch("/api/jobs");
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setJobOpeningsList(jobsData);
        }
      } catch (e) {
        console.error("Failed to load jobs from API, using default local data", e);
      }

      // 2. Fetch screenings
      try {
        const screeningsRes = await fetch("/api/screen");
        if (screeningsRes.ok) {
          const screeningsData = await screeningsRes.json();
          if (screeningsData && screeningsData.length > 0) {
            setScreenings(screeningsData);
            localStorage.setItem("clara_screenings", JSON.stringify(screeningsData));
            return;
          }
        }
      } catch (e) {
        console.error("Failed to load screenings from API, falling back to local storage", e);
      }

      // LocalStorage fallback if API returned empty or failed
      const saved = localStorage.getItem("clara_screenings");
      if (saved) {
        setScreenings(JSON.parse(saved));
      } else {
        localStorage.setItem("clara_screenings", JSON.stringify(defaultMockScreenings));
        setScreenings(defaultMockScreenings);
      }
    }

    loadData();

    const savedKey = localStorage.getItem("clara_temp_key") || "";
    setTempApiKey(savedKey);
  }, []);

  const saveScreeningsToStorage = (updated: SavedScreening[]) => {
    localStorage.setItem("clara_screenings", JSON.stringify(updated));
    setScreenings(updated);
  };

  // Form Validation
  const isFormValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isAgeValid = !isNaN(Number(form.age)) && Number(form.age) > 0;
    
    return (
      form.name.trim() !== "" &&
      emailRegex.test(form.email) &&
      form.phone.trim().length >= 6 &&
      form.address.trim() !== "" &&
      isAgeValid &&
      form.currentLocation.trim() !== "" &&
      selectedJobId !== "" &&
      resumeFile !== null
    );
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleJobInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setJobForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "docx") {
      setFileError("Only .docx (Word documents) are accepted. PDFs are not allowed.");
      setResumeFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setFileError(null);
      setResumeFile(file);
    }
  };

  const removeFile = () => {
    setResumeFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const triggerScreening = async () => {
    if (!resumeFile || !isFormValid()) return;

    setIsLoading(true);
    setFormStep("screening");
    setApiError(null);

    const formData = new FormData();
    formData.append("file", resumeFile);
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("phone", form.phone);
    formData.append("address", form.address);
    formData.append("age", form.age);
    formData.append("currentLocation", form.currentLocation);
    formData.append("jobOpeningId", selectedJobId);

    // If a temporary key is configured in settings, inject it in headers
    const headers: HeadersInit = {};
    if (tempApiKey.trim() !== "") {
      headers["x-llm-api-key"] = tempApiKey.trim();
    }

    try {
      const response = await fetch("/api/screen", {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Screening failed");
      }

      // Add to local screenings list
      const selectedJob = jobOpeningsList.find(j => j.id === selectedJobId);
      const newScreening: SavedScreening = {
        id: data.id || `scr-${Date.now()}`,
        candidateName: form.name,
        candidateEmail: form.email,
        candidatePhone: form.phone,
        candidateAddress: form.address,
        candidateAge: Number(form.age),
        candidateLocation: form.currentLocation,
        jobId: selectedJobId,
        jobTitle: selectedJob?.title || "Unknown Position",
        jobCompany: selectedJob?.company || "Unknown Company",
        matchScore: data.match_score,
        overallFit: data.overall_fit,
        strongMatches: data.strong_matches || [],
        gapsAndQuestions: data.gaps_and_questions || [],
        screenedAt: new Date().toISOString(),
        warning: data.warning
      };

      const updated = [newScreening, ...screenings];
      saveScreeningsToStorage(updated);
      
      // Transition to screenings results view
      setSelectedScreeningId(newScreening.id);
      setActiveTab("screenings");
      resetFormWorkflow();
    } catch (error: any) {
      console.error(error);
      setApiError(error.message || "An unexpected error occurred during screening.");
      setFormStep("review");
    } finally {
      setIsLoading(false);
    }
  };

  const resetFormWorkflow = () => {
    setForm(initialForm);
    setSelectedJobId("");
    setResumeFile(null);
    setFileError(null);
    setFormStep("form");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Add Job Opening Action
  const handleAddJobOpening = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.title.trim() || !jobForm.company.trim() || !jobForm.description.trim()) return;

    setIsJobLoading(true);
    setJobApiError(null);

    // Format list inputs from lines
    const formatList = (text: string) => text.split("\n").map(l => l.trim()).filter(l => l !== "");
    const responsibilities = formatList(jobForm.responsibilitiesText);
    const experience = formatList(jobForm.experienceText);
    const skillsList = formatList(jobForm.skillsText);

    // Dynamic grouping of skills for compatibility
    const skills = [{ category: "Required Core Skills", items: skillsList }];

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: jobForm.title,
          company: jobForm.company,
          description: jobForm.description,
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

      setJobOpeningsList([data, ...jobOpeningsList]);
      setJobForm(initialJobForm);
      setShowAddJobForm(false);
      alert(data.warning || "Job opening added successfully!");
    } catch (error: any) {
      console.error(error);
      setJobApiError(error.message || "Failed to save job opening.");
    } finally {
      setIsJobLoading(false);
    }
  };

  // Metrics Helpers
  const getAverageScore = () => {
    if (screenings.length === 0) return 0;
    const sum = screenings.reduce((acc, curr) => acc + curr.matchScore, 0);
    return Math.round(sum / screenings.length);
  };

  const getScoreRating = (score: number) => {
    if (score >= 85) return { text: "Strong match", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (score >= 70) return { text: "Good potential fit", color: "text-blue-700 bg-blue-50 border-blue-200" };
    if (score >= 50) return { text: "Moderate fit", color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { text: "Weak fit", color: "text-rose-700 bg-rose-50 border-rose-200" };
  };

  // Settings Actions
  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("clara_temp_key", tempApiKey);
    alert("API key saved locally. Future screening requests will use this key!");
  };

  const handleResetDatabase = () => {
    if (confirm("Are you sure you want to reset the local database? This will restore the 3 default mock candidates.")) {
      localStorage.setItem("clara_screenings", JSON.stringify(defaultMockScreenings));
      setScreenings(defaultMockScreenings);
      setSelectedScreeningId(null);
      alert("Local database reset successfully!");
    }
  };

  const handleDeleteScreening = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this screening record?")) {
      try {
        const res = await fetch(`/api/screen?id=${id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to delete from database");
        }
      } catch (error) {
        console.error("API deletion failed, clearing only locally", error);
      }

      const filtered = screenings.filter(s => s.id !== id);
      saveScreeningsToStorage(filtered);
      if (selectedScreeningId === id) {
        setSelectedScreeningId(null);
      }
    }
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
        // Keep the latest record
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="mx-auto max-w-5xl px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="cursor-pointer" onClick={() => { setActiveTab("dashboard"); setSelectedScreeningId(null); }}>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-black">C</span>
              ClaraScreen <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100 font-semibold tracking-normal normal-case">Enterprise AI</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">High-fidelity candidate matching and recruitment dashboard.</p>
          </div>
          <nav className="flex items-center gap-6 text-xs font-semibold text-slate-500">
            <button 
              onClick={() => { setActiveTab("dashboard"); setSelectedScreeningId(null); }}
              className={`hover:text-slate-950 transition-colors ${activeTab === "dashboard" ? "text-blue-600 font-bold" : ""}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => { setActiveTab("screenings"); setSelectedScreeningId(null); }}
              className={`hover:text-slate-950 transition-colors ${activeTab === "screenings" && !selectedScreeningId ? "text-blue-600 font-bold" : ""}`}
            >
              Screenings
            </button>
            <button 
              onClick={() => { setActiveTab("screen"); resetFormWorkflow(); }}
              className={`hover:text-slate-950 transition-colors ${activeTab === "screen" ? "text-blue-600 font-bold" : ""}`}
            >
              Screen Candidate
            </button>
            <button 
              onClick={() => { setActiveTab("jobs"); setSelectedScreeningId(null); }}
              className={`hover:text-slate-950 transition-colors ${activeTab === "jobs" ? "text-blue-600 font-bold" : ""}`}
            >
              Job Openings
            </button>
            <button 
              onClick={() => { setActiveTab("candidates"); setSelectedScreeningId(null); }}
              className={`hover:text-slate-950 transition-colors ${activeTab === "candidates" ? "text-blue-600 font-bold" : ""}`}
            >
              Global Candidates
            </button>
            <button 
              onClick={() => { setActiveTab("settings"); setSelectedScreeningId(null); }}
              className={`hover:text-slate-950 transition-colors ${activeTab === "settings" ? "text-blue-600 font-bold" : ""}`}
            >
              Settings
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        
        {/* TAB 1: DASHBOARD VIEW */}
        {activeTab === "dashboard" && (
          <div className="flex flex-col gap-8 animate-fadeIn">
            {/* Page Header */}
            <div>
              <h2 className="text-lg font-bold text-slate-900">Workspace Dashboard</h2>
              <p className="text-xs text-slate-500">Overview of evaluations and screening pipelines.</p>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Candidates</span>
                <span className="text-2xl font-extrabold text-slate-950">{screenings.length}</span>
                <span className="text-[9px] text-slate-500 mt-1">Evaluated in browser</span>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Match</span>
                <span className="text-2xl font-extrabold text-slate-950">{getAverageScore()}%</span>
                <span className="text-[9px] text-slate-500 mt-1">Target role threshold</span>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Strong Matches</span>
                <span className="text-2xl font-extrabold text-slate-950">{screenings.filter(s => s.matchScore >= 85).length}</span>
                <span className="text-[9px] text-emerald-600 font-semibold mt-1">✓ Ready for call</span>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Positions</span>
                <span className="text-2xl font-extrabold text-slate-950">{jobOpeningsList.length}</span>
                <span className="text-[9px] text-slate-500 mt-1">Recruitment pipelines</span>
              </div>
            </div>

            {/* Layout: Recent Screenings & Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Left Column: Recent Screenings table */}
              <div className="md:col-span-8 bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Recent Screenings</h3>
                  <button 
                    onClick={() => setActiveTab("screenings")}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold"
                  >
                    View All
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider text-[9px] font-bold">
                        <th className="px-5 py-3">Candidate</th>
                        <th className="px-5 py-3">Target Opening</th>
                        <th className="px-5 py-3">Score</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {screenings.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-8 text-center text-slate-400 italic">No screenings recorded yet. Click \"Screen Candidate\" to start!</td>
                        </tr>
                      ) : (
                        screenings.slice(0, 5).map((s) => (
                          <tr 
                            key={s.id} 
                            onClick={() => { setSelectedScreeningId(s.id); setActiveTab("screenings"); }}
                            className="hover:bg-slate-50 cursor-pointer transition-colors group"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-955 group-hover:text-blue-600 transition-colors">{s.candidateName}</span>
                                <span className="text-[10px] text-slate-500">{s.candidateLocation}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-900">{s.jobTitle}</span>
                                <span className="text-[10px] text-slate-400">{s.jobCompany}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getScoreRating(s.matchScore).color}`}>
                                {s.matchScore}%
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => { setSelectedScreeningId(s.id); setActiveTab("screenings"); }}
                                className="text-blue-600 hover:underline mr-3 font-semibold"
                              >
                                View
                              </button>
                              <button 
                                onClick={(e) => handleDeleteScreening(s.id, e)}
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

              {/* Right Column: Roles Quick Summary list */}
              <div className="md:col-span-4 flex flex-col gap-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col gap-4">
                  <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Active Pipelines</h3>
                    <button 
                      onClick={() => setActiveTab("jobs")}
                      className="text-xs text-blue-600 hover:text-blue-700 font-bold"
                    >
                      Manage
                    </button>
                  </div>
                  <div className="flex flex-col gap-4">
                    {jobOpeningsList.slice(0, 4).map((job) => {
                      const countForJob = screenings.filter(s => s.jobId === job.id).length;
                      return (
                        <div key={job.id} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                          <div className="flex flex-col gap-0.5 pr-2 truncate">
                            <span className="text-xs font-semibold text-slate-900 truncate leading-tight">{job.title}</span>
                            <span className="text-[10px] text-slate-400 truncate">{job.company}</span>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold shrink-0">
                            {countForJob} screened
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Database Connection Info panel */}
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col gap-2">
                  <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Database Connection Status
                  </span>
                  <p className="text-[10px] text-blue-600 leading-relaxed">
                    If Vercel's `DATABASE_URL` is set, listings automatically read/write to your live Postgres database. Otherwise, the app falls back to secure localStorage.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: SCREENINGS LIST / CANDIDATE DETAILED RESULTS */}
        {activeTab === "screenings" && (
          <div className="animate-fadeIn">
            {activeScreening ? (
              /* INDIVIDUAL CANDIDATE SCREENING RESULT VIEW */
              <div className="flex flex-col gap-6">
                {/* Back Link */}
                <button 
                  onClick={() => setSelectedScreeningId(null)}
                  className="text-xs text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1 self-start"
                >
                  ← Back to all screenings
                </button>

                {/* Warning message if simulated result */}
                {activeScreening.warning && (
                  <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{activeScreening.warning}</span>
                  </div>
                )}

                {/* Screening Header card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Candidate Screening Result</span>
                    <h2 className="text-xl font-bold text-slate-955">{activeScreening.candidateName}</h2>
                    <p className="text-xs text-slate-500">
                      {activeScreening.jobTitle} — <span className="font-semibold text-slate-700">{activeScreening.jobCompany}</span>
                    </p>
                    <span className="text-[9px] text-slate-400 mt-0.5">Screened on {new Date(activeScreening.screenedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <div className="text-3xl font-extrabold text-slate-950">{activeScreening.matchScore}<span className="text-sm font-medium text-slate-400">/100</span></div>
                      <span className={`text-[10px] px-2.5 py-0.5 mt-1 font-semibold rounded-full border ${getScoreRating(activeScreening.matchScore).color}`}>
                        {getScoreRating(activeScreening.matchScore).text}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Main Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  
                  {/* Left Column: Overall Fit & Strengths */}
                  <div className="md:col-span-7 flex flex-col gap-6">
                    {/* Overall Fit text block */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col gap-3">
                      <h3 className="text-sm font-bold text-slate-950 border-b border-slate-100 pb-2">Overall Fit</h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">{activeScreening.overallFit}</p>
                    </div>

                    {/* Strong Matches bullet list */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col gap-3">
                      <h3 className="text-sm font-bold text-slate-950 border-b border-slate-100 pb-2">Strong Matches</h3>
                      {activeScreening.strongMatches && activeScreening.strongMatches.length > 0 ? (
                        <ul className="flex flex-col gap-3">
                          {activeScreening.strongMatches.map((strength, index) => (
                            <li key={index} className="flex gap-2.5 text-xs text-slate-600 leading-relaxed">
                              <span className="text-emerald-500 font-semibold shrink-0">✓</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-slate-500 italic py-1">No significant matching requirements found in the resume for this position.</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Candidate Profile details & Gaps */}
                  <div className="md:col-span-5 flex flex-col gap-6">
                    {/* Candidate Info profile card */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col gap-4">
                      <h3 className="text-sm font-bold text-slate-950 border-b border-slate-100 pb-1">Candidate Profile</h3>
                      <div className="text-xs flex flex-col gap-2">
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

                    {/* Gaps & Questions recruiter box */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col gap-3">
                      <h3 className="text-sm font-bold text-slate-950 border-b border-slate-100 pb-2">Gaps & Interview Questions</h3>
                      {activeScreening.gapsAndQuestions && activeScreening.gapsAndQuestions.length > 0 ? (
                        <div className="flex flex-col gap-5 divide-y divide-slate-100">
                          {activeScreening.gapsAndQuestions.map((item, index) => (
                            <div key={index} className={`flex flex-col gap-2 ${index > 0 ? "pt-4" : ""}`}>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Gap / Uncertainty</span>
                                <p className="text-xs text-slate-700 leading-relaxed">{item.gap}</p>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">Ask Recruiter Question</span>
                                <p className="text-xs font-semibold text-slate-800 leading-relaxed italic">"{item.question}"</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic py-1">No significant gaps or uncertainties detected.</p>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              /* SCREENINGS TABLE HISTORY VIEW */
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Evaluation Records</h2>
                  <p className="text-xs text-slate-500">History of all candidate screenings performed.</p>
                </div>

                {/* Filter header block */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                  <div className="w-full md:w-72 relative">
                    <input 
                      type="text" 
                      placeholder="Search candidate or position..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full py-1.5 pl-8 pr-3 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                    <span className="absolute left-2.5 top-2.5 text-slate-400">🔍</span>
                  </div>

                  <div className="w-full md:w-auto flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</span>
                      <select 
                        value={filterJobId}
                        onChange={(e) => setFilterJobId(e.target.value)}
                        className="py-1.5 px-3 border border-slate-300 bg-white rounded-lg text-xs outline-none focus:border-blue-500"
                      >
                        <option value="all">All openings</option>
                        {jobOpeningsList.map(job => (
                          <option key={job.id} value={job.id}>{job.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fit</span>
                      <select 
                        value={filterFit}
                        onChange={(e) => setFilterFit(e.target.value)}
                        className="py-1.5 px-3 border border-slate-300 bg-white rounded-lg text-xs outline-none focus:border-blue-500"
                      >
                        <option value="all">All match levels</option>
                        <option value="strong">Strong match (&gt;= 85)</option>
                        <option value="good">Good fit (70-84)</option>
                        <option value="moderate">Moderate fit (50-69)</option>
                        <option value="weak">Weak fit (&lt; 50)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Table list */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider text-[9px] font-bold">
                          <th className="px-5 py-3">Candidate</th>
                          <th className="px-5 py-3">Applied Position</th>
                          <th className="px-5 py-3">Match Score</th>
                          <th className="px-5 py-3">Screening Date</th>
                          <th className="px-5 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {getFilteredScreenings().length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-5 py-12 text-center text-slate-400 italic">
                              No evaluation records match your filter criteria.
                            </td>
                          </tr>
                        ) : (
                          getFilteredScreenings().map((s) => (
                            <tr 
                              key={s.id} 
                              onClick={() => setSelectedScreeningId(s.id)}
                              className="hover:bg-slate-50 cursor-pointer transition-colors group"
                            >
                              <td className="px-5 py-4">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-955 group-hover:text-blue-600 transition-colors">{s.candidateName}</span>
                                  <span className="text-[10px] text-slate-400">{s.candidateEmail}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-900">{s.jobTitle}</span>
                                  <span className="text-[10px] text-slate-400">{s.jobCompany}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getScoreRating(s.matchScore).color}`}>
                                  {s.matchScore}%
                                </span>
                              </td>
                              <td className="px-5 py-4 text-slate-500">
                                {new Date(s.screenedAt).toLocaleDateString()}
                              </td>
                              <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <button 
                                  onClick={() => setSelectedScreeningId(s.id)}
                                  className="text-blue-600 hover:underline mr-4 font-semibold"
                                >
                                  Review Report
                                </button>
                                <button 
                                  onClick={(e) => handleDeleteScreening(s.id, e)}
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
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SCREEN CANDIDATE (FORM WORKFLOW) */}
        {activeTab === "screen" && (
          <div className="mx-auto max-w-2xl animate-fadeIn">
            {/* Page Header */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">Initiate Evaluation</h2>
              <p className="text-xs text-slate-500">Fill in candidate credentials, upload resume, and select the target opening.</p>
            </div>

            {/* Workflow Navigation Header */}
            <div className="mb-8 flex justify-center text-xs font-semibold text-slate-400 border-b border-slate-200 pb-3">
              <span className={`pb-3 border-b-2 px-4 transition-colors ${formStep === "form" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent"}`}>
                1. Candidate Details
              </span>
              <span className="pb-3 px-4">→</span>
              <span className={`pb-3 border-b-2 px-4 transition-colors ${formStep === "review" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent"}`}>
                2. Review
              </span>
              <span className="pb-3 px-4">→</span>
              <span className={`pb-3 border-b-2 px-4 transition-colors ${formStep === "screening" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent"}`}>
                3. Screening Results
              </span>
            </div>

            {/* ERROR ALERTS */}
            {apiError && (
              <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex flex-col gap-1">
                <span className="font-bold">Screening Failed:</span>
                <span>{apiError}</span>
              </div>
            )}

            {/* STEP 1: FORM DETAILS */}
            {formStep === "form" && (
              <form onSubmit={(e) => { e.preventDefault(); if (isFormValid()) setFormStep("review"); }} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6">
                
                {/* 1. Candidate Details group */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-2">1. Candidate Information</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Full Name</label>
                      <input 
                        type="text" 
                        name="name" 
                        placeholder="e.g. Rahul Sharma"
                        value={form.name} 
                        onChange={handleInputChange}
                        required
                        className="py-1.5 px-3 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Email Address</label>
                      <input 
                        type="email" 
                        name="email" 
                        placeholder="e.g. name@example.com"
                        value={form.email} 
                        onChange={handleInputChange}
                        required
                        className="py-1.5 px-3 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Phone Number</label>
                      <input 
                        type="text" 
                        name="phone" 
                        placeholder="e.g. +91 99999 88888"
                        value={form.phone} 
                        onChange={handleInputChange}
                        required
                        className="py-1.5 px-3 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Current Location</label>
                      <input 
                        type="text" 
                        name="currentLocation" 
                        placeholder="e.g. Jaipur, Rajasthan"
                        value={form.currentLocation} 
                        onChange={handleInputChange}
                        required
                        className="py-1.5 px-3 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">Age</label>
                      <input 
                        type="number" 
                        name="age" 
                        placeholder="e.g. 24"
                        value={form.age} 
                        onChange={handleInputChange}
                        required
                        min="1"
                        className="py-1.5 px-3 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Residential Address</label>
                    <input 
                      type="text" 
                      name="address" 
                      placeholder="e.g. Mansarovar, Jaipur"
                      value={form.address} 
                      onChange={handleInputChange}
                      required
                      className="py-1.5 px-3 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* 2. Drag & Drop DOCX Upload group */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-2">2. Upload Candidate Resume</h3>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-700">Resume File (.docx only)</label>
                    <div 
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/20 rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center"
                    >
                      <span className="text-3xl text-slate-400">📄</span>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-700">Click to upload or drag & drop</span>
                        <span className="text-[10px] text-slate-400">Microsoft Word (.docx) files up to 4MB. PDFs are not accepted.</span>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".docx"
                        className="hidden" 
                      />
                    </div>
                  </div>

                  {fileError && <p className="text-[10px] text-rose-500 font-semibold">{fileError}</p>}

                  {resumeFile && (
                    <div className="p-3.5 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📄</span>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 truncate max-w-xs">{resumeFile.name}</span>
                          <span className="text-[9px] text-slate-500">({(resumeFile.size / 1024).toFixed(1)} KB)</span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={removeFile}
                        className="text-rose-500 hover:text-rose-700 font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Opening selector group */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-2">3. Target Job Opening</h3>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Select Job Opening</label>
                    <select 
                      value={selectedJobId} 
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      required
                      className="py-2 px-3 border border-slate-300 bg-white rounded-lg text-xs outline-none focus:border-blue-500 transition-all"
                    >
                      <option value="">-- Choose target opening --</option>
                      {jobOpeningsList.map(job => (
                        <option key={job.id} value={job.id}>{job.title} ({job.company})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={!isFormValid()}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold text-center transition-all ${
                    isFormValid() 
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm" 
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  Review Screening Details
                </button>

              </form>
            )}

            {/* STEP 2: REVIEW CARD DETAILS */}
            {formStep === "review" && selectedJob && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6 animate-fadeIn">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Review Screening Submission</h3>
                
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-3 grid grid-cols-3 gap-4">
                    <span className="font-semibold text-slate-400">Candidate Name</span>
                    <span className="col-span-2 font-medium text-slate-900">{form.name}</span>
                  </div>
                  <div className="py-3 grid grid-cols-3 gap-4">
                    <span className="font-semibold text-slate-400">Email</span>
                    <span className="col-span-2 font-medium text-slate-900">{form.email}</span>
                  </div>
                  <div className="py-3 grid grid-cols-3 gap-4">
                    <span className="font-semibold text-slate-400">Phone</span>
                    <span className="col-span-2 font-medium text-slate-950">{form.phone}</span>
                  </div>
                  <div className="py-3 grid grid-cols-3 gap-4">
                    <span className="font-semibold text-slate-400">Location</span>
                    <span className="col-span-2 font-medium text-slate-900">{form.currentLocation}</span>
                  </div>
                  <div className="py-3 grid grid-cols-3 gap-4">
                    <span className="font-semibold text-slate-400">Resume File</span>
                    <span className="col-span-2 font-medium text-slate-900">{resumeFile?.name} ({(resumeFile!.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <div className="py-3 grid grid-cols-3 gap-4">
                    <span className="font-semibold text-slate-400">Applying for</span>
                    <div className="col-span-2 flex flex-col gap-0.5">
                      <span className="font-semibold text-slate-900">{selectedJob.title}</span>
                      <span className="text-[10px] text-slate-500">{selectedJob.company}</span>
                    </div>
                  </div>
                </div>

                {/* API Key Hint if none set */}
                {tempApiKey.trim() === "" && (
                  <div className="p-3 rounded bg-blue-50 border border-blue-100 text-[10px] text-blue-800 leading-normal flex items-start gap-2">
                    <span>💡</span>
                    <span>No personal API key configured in Settings. The server will run in Simulated/Mock Mode. To run live LLM analysis, configure your key in settings.</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setFormStep("form")}
                    className="flex-1 py-2 px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors text-center"
                  >
                    Back to Edit
                  </button>
                  <button
                    type="button"
                    onClick={triggerScreening}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors text-center shadow-sm"
                  >
                    Initiate AI Screening
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SCREENING ACTIVE LOADER */}
            {formStep === "screening" && (
              <div className="mx-auto max-w-md bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center gap-6">
                <div className="relative w-12 h-12">
                  <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-sm font-bold text-slate-900">Comparing candidate against opening...</h3>
                  <p className="text-xs text-slate-500 px-4">
                    Reading resume text, evaluating strengths, and generating follow-up recruiter questions. This takes approximately 10–15 seconds.
                  </p>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 4: JOB OPENINGS (MANAGE / ADD JDS) */}
        {activeTab === "jobs" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Active Job Openings</h2>
                <p className="text-xs text-slate-500">Pipeline opportunities for candidate resume alignment evaluations.</p>
              </div>
              <button
                onClick={() => setShowAddJobForm(!showAddJobForm)}
                className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                {showAddJobForm ? "Cancel" : "Add New Opening"}
              </button>
            </div>

            {/* ADD JOB OPENING FORM CARD */}
            {showAddJobForm && (
              <form onSubmit={handleAddJobOpening} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 animate-fadeIn">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-2">Create Target Job Opening</h3>
                
                {jobApiError && (
                  <p className="text-xs text-rose-600 font-semibold">{jobApiError}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Role Title</label>
                    <input 
                      type="text" 
                      name="title"
                      required
                      placeholder="e.g. Sales Associate"
                      value={jobForm.title}
                      onChange={handleJobInputChange}
                      className="py-1.5 px-3 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Company Name</label>
                    <input 
                      type="text" 
                      name="company"
                      required
                      placeholder="e.g. Acme Corp"
                      value={jobForm.company}
                      onChange={handleJobInputChange}
                      className="py-1.5 px-3 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Role Description Summary</label>
                  <textarea 
                    name="description"
                    required
                    rows={3}
                    placeholder="Provide a general overview of the role and team objectives..."
                    value={jobForm.description}
                    onChange={handleJobInputChange}
                    className="py-1.5 px-3 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 font-normal resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Key Responsibilities (One per line)</label>
                    <textarea 
                      name="responsibilitiesText"
                      rows={4}
                      placeholder="e.g. Manage pipeline metrics&#10;Present weekly slide decks"
                      value={jobForm.responsibilitiesText}
                      onChange={handleJobInputChange}
                      className="py-1.5 px-3 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 font-normal resize-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Required Skills (One per line)</label>
                    <textarea 
                      name="skillsText"
                      rows={4}
                      placeholder="e.g. Advanced Excel&#10;PowerPoint design"
                      value={jobForm.skillsText}
                      onChange={handleJobInputChange}
                      className="py-1.5 px-3 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 font-normal resize-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Experience Needed (One per line)</label>
                    <textarea 
                      name="experienceText"
                      rows={4}
                      placeholder="e.g. 2-3 years at Tier-1 firm&#10;Consulting background preferred"
                      value={jobForm.experienceText}
                      onChange={handleJobInputChange}
                      className="py-1.5 px-3 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 font-normal resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isJobLoading}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  {isJobLoading ? "Saving Job..." : "Save Job Opening"}
                </button>
              </form>
            )}

            {/* JOB OPENINGS LISTING GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {jobOpeningsList.map(job => {
                const jobScreeningsCount = screenings.filter(s => s.jobId === job.id).length;
                return (
                  <div key={job.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{job.company}</span>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">{job.title}</h4>
                      </div>
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 shrink-0">
                        {jobScreeningsCount} screenings
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{job.description}</p>

                    <div className="flex flex-wrap gap-1.5 border-t border-slate-50 pt-3">
                      {job.skills?.[0]?.items?.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* TAB 5: GLOBAL CANDIDATES VIEW */}
        {activeTab === "candidates" && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Global Candidates</h2>
              <p className="text-xs text-slate-500">Unified list of all unique job applicants screened across roles.</p>
            </div>

            {/* Table wrapper */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider text-[9px] font-bold">
                      <th className="px-5 py-3">Candidate</th>
                      <th className="px-5 py-3">Contact Details</th>
                      <th className="px-5 py-3">Latest Target Openings</th>
                      <th className="px-5 py-3">Location</th>
                      <th className="px-5 py-3 text-right">Evaluations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {getGlobalCandidates().length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-slate-400 italic">No candidates evaluated in this workspace yet.</td>
                      </tr>
                    ) : (
                      getGlobalCandidates().map((c, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 font-semibold text-slate-950">
                            {c.name}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col">
                              <span>{c.email}</span>
                              <span className="text-[10px] text-slate-400">{c.phone}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800">{c.latestRole}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getScoreRating(c.latestScore).color}`}>
                                {c.latestScore}%
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-500">
                            {c.location}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold">
                              {c.applicationsCount} role(s)
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS VIEW */}
        {activeTab === "settings" && (
          <div className="mx-auto max-w-xl flex flex-col gap-8 animate-fadeIn">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Workspace Settings</h2>
              <p className="text-xs text-slate-500">Configure credentials and local testing parameters.</p>
            </div>

            {/* API key settings card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">LLM Provider Authentication</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                By default, Vercel deployments read the secure server-side environment key. You can override it locally in this browser session by supplying your own API key below.
              </p>
              
              <form onSubmit={handleSaveApiKey} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">API Key Override (Groq, Gemini, or Grok/xAI)</label>
                  <input 
                    type="password" 
                    placeholder="Enter gsk_... or AQ... or xai-..."
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    className="py-1.5 px-3 border border-slate-300 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                  />
                  <span className="text-[9px] text-slate-400">Saved in your browser's LocalStorage. Will not be sent anywhere except your secure backend routes.</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    type="submit" 
                    className="py-1.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                  >
                    Save Key locally
                  </button>
                  {tempApiKey && (
                    <button 
                      type="button" 
                      onClick={() => { setTempApiKey(""); localStorage.removeItem("clara_temp_key"); alert("Local API key override cleared!"); }}
                      className="py-1.5 px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Clear Override
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Database reset settings card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-950 border-b border-slate-100 pb-2">Workspace Reset Actions</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Clear all candidate evaluations saved in this browser and restore the pre-populated dashboard demonstration profiles.
              </p>
              <div>
                <button 
                  onClick={handleResetDatabase}
                  className="py-2 px-4 border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-lg transition-colors"
                >
                  Reset Dashboard Database
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
