"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import { jobOpenings, JobOpening } from "@/data/jobs";

interface GapQuestion {
  gap: string;
  question: string;
}

interface ScreeningResult {
  match_score: number;
  overall_fit: string;
  strong_matches: string[];
  gaps_and_questions: GapQuestion[];
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

const initialForm: CandidateForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  age: "",
  currentLocation: ""
};

export default function InterviewScreener() {
  const [form, setForm] = useState<CandidateForm>(initialForm);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  
  // Workflow states: 'form' | 'review' | 'screening' | 'results'
  const [step, setStep] = useState<"form" | "review" | "screening" | "results">("form");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [screeningResult, setScreeningResult] = useState<ScreeningResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form validation helper
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

  const removeFile = () => {
    setResumeFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReviewTransition = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid()) {
      setStep("review");
    }
  };

  const triggerScreening = async () => {
    if (!resumeFile || !isFormValid()) return;

    setIsLoading(true);
    setStep("screening");
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

    try {
      const response = await fetch("/api/screen", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Screening failed");
      }

      setScreeningResult(data);
      setStep("results");
    } catch (error: any) {
      console.error(error);
      setApiError(error.message || "An unexpected error occurred during screening.");
      setStep("review");
    } finally {
      setIsLoading(false);
    }
  };

  const resetAll = () => {
    setForm(initialForm);
    setSelectedJobId("");
    setResumeFile(null);
    setFileError(null);
    setScreeningResult(null);
    setApiError(null);
    setStep("form");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectedJob = jobOpenings.find(j => j.id === selectedJobId);

  // Score description helper
  const getScoreRating = (score: number) => {
    if (score >= 85) return { text: "Strong match", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (score >= 70) return { text: "Good potential fit", color: "text-blue-700 bg-blue-50 border-blue-200" };
    if (score >= 50) return { text: "Moderate fit", color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { text: "Weak fit", color: "text-rose-700 bg-rose-50 border-rose-200" };
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Interview Screener</h1>
            <p className="text-xs text-slate-500 mt-0.5">Quickly compare candidates against open roles.</p>
          </div>
          <nav className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <button 
              onClick={resetAll} 
              className={`hover:text-slate-900 ${step !== "results" ? "text-slate-900 font-semibold" : ""}`}
            >
              Screen Candidate
            </button>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400">About / Approach</span>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        
        {/* Step Progress Indicators */}
        {step !== "screening" && (
          <div className="mb-8 flex items-center gap-2 text-xs font-medium text-slate-400">
            <span className={step === "form" ? "text-blue-600 font-semibold" : "text-slate-600"}>1. Candidate Details</span>
            <span className="text-slate-300">→</span>
            <span className={step === "review" ? "text-blue-600 font-semibold" : ""}>2. Review</span>
            <span className="text-slate-300">→</span>
            <span className={step === "results" ? "text-blue-600 font-semibold" : ""}>3. Evaluation Results</span>
          </div>
        )}

        {apiError && (
          <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex flex-col gap-2 shadow-sm">
            <div className="font-semibold flex items-center gap-1.5">
              <span>⚠️</span> Screening Error
            </div>
            <p>{apiError}</p>
            <button
              onClick={triggerScreening}
              className="w-fit mt-1 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs font-semibold rounded-md border border-rose-300 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* STEP 1: FORM SECTION */}
        {step === "form" && (
          <form onSubmit={handleReviewTransition} className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Column: Personal Information */}
            <div className="md:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-1">Candidate Details</h2>
                <p className="text-xs text-slate-500">Provide basic demographic and contact information.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="text-xs font-semibold text-slate-700">Full Name <span className="text-rose-500">*</span></label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleInputChange}
                    className="px-3 py-2 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-slate-700">Email Address <span className="text-rose-500">*</span></label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={handleInputChange}
                    className="px-3 py-2 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phone" className="text-xs font-semibold text-slate-700">Phone Number <span className="text-rose-500">*</span></label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={handleInputChange}
                    className="px-3 py-2 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="age" className="text-xs font-semibold text-slate-700">Age <span className="text-rose-500">*</span></label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    required
                    min="18"
                    max="100"
                    placeholder="25"
                    value={form.age}
                    onChange={handleInputChange}
                    className="px-3 py-2 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label htmlFor="currentLocation" className="text-xs font-semibold text-slate-700">Current Location / Place <span className="text-rose-500">*</span></label>
                  <input
                    id="currentLocation"
                    name="currentLocation"
                    type="text"
                    required
                    placeholder="Mumbai, Maharashtra"
                    value={form.currentLocation}
                    onChange={handleInputChange}
                    className="px-3 py-2 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label htmlFor="address" className="text-xs font-semibold text-slate-700">Full Postal Address <span className="text-rose-500">*</span></label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    required
                    placeholder="123, Nariman Point, Marine Drive"
                    value={form.address}
                    onChange={handleInputChange}
                    className="px-3 py-2 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Resume Upload & Job Opening */}
            <div className="md:col-span-5 flex flex-col gap-6">
              {/* Job Opening Section */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 mb-1">Target Opening</h2>
                  <p className="text-xs text-slate-500">Select which role the candidate is applying for.</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="jobOpeningId" className="text-xs font-semibold text-slate-700">Select Opening <span className="text-rose-500">*</span></label>
                  <select
                    id="jobOpeningId"
                    value={selectedJobId}
                    required
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="px-3 py-2 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">-- Choose Job Opening --</option>
                    {jobOpenings.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title} — {job.company}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedJob && (
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 text-xs flex flex-col gap-1.5">
                    <div className="font-semibold text-slate-900">{selectedJob.title}</div>
                    <div className="text-slate-600">{selectedJob.company} {selectedJob.grade ? `(${selectedJob.grade})` : ""}</div>
                    <div className="text-slate-500 line-clamp-3 mt-1.5 leading-relaxed">{selectedJob.description}</div>
                  </div>
                )}
              </div>

              {/* Resume Upload Section */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 mb-1">Resume Upload</h2>
                  <p className="text-xs text-slate-500">Only Microsoft Word (.docx) files are supported.</p>
                </div>

                {/* Upload Area */}
                {!resumeFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-400 cursor-pointer transition-colors"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".docx"
                      className="hidden"
                    />
                    <div className="text-2xl mb-1.5 text-slate-400">📄</div>
                    <p className="text-xs font-semibold text-slate-800 text-center">Drag & drop your .docx resume here, or browse</p>
                    <p className="text-[10px] text-slate-500 mt-1">Accepted format: DOCX (Word Document)</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="text-xl">📄</div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{resumeFile.name}</p>
                        <p className="text-[10px] text-slate-500">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {fileError && (
                  <p className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded px-2.5 py-1.5 mt-1.5">
                    {fileError}
                  </p>
                )}
              </div>

              {/* Submit / Proceed Button */}
              <button
                type="submit"
                disabled={!isFormValid()}
                className={`w-full py-2.5 px-4 font-semibold text-xs rounded-lg text-center transition-colors shadow-sm ${
                  isFormValid()
                    ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-100"
                }`}
              >
                Review Application
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: REVIEW BEFORE SCREENING */}
        {step === "review" && selectedJob && (
          <div className="mx-auto max-w-2xl bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-1">Review Candidate Profile</h2>
              <p className="text-xs text-slate-500">Ensure the target role and candidate details are correct before screening.</p>
            </div>

            {/* Review fields layout */}
            <div className="border-t border-slate-100 divide-y divide-slate-100 text-xs">
              <div className="py-3.5 grid grid-cols-3 gap-4">
                <span className="font-semibold text-slate-500">Candidate</span>
                <span className="col-span-2 font-medium text-slate-900">{form.name}</span>
              </div>
              <div className="py-3.5 grid grid-cols-3 gap-4">
                <span className="font-semibold text-slate-500">Email</span>
                <span className="col-span-2 font-medium text-slate-900">{form.email}</span>
              </div>
              <div className="py-3.5 grid grid-cols-3 gap-4">
                <span className="font-semibold text-slate-500">Phone</span>
                <span className="col-span-2 font-medium text-slate-900">{form.phone}</span>
              </div>
              <div className="py-3.5 grid grid-cols-3 gap-4">
                <span className="font-semibold text-slate-500">Location</span>
                <span className="col-span-2 font-medium text-slate-900">{form.currentLocation}</span>
              </div>
              <div className="py-3.5 grid grid-cols-3 gap-4">
                <span className="font-semibold text-slate-500">Resume File</span>
                <span className="col-span-2 font-medium text-slate-900">{resumeFile?.name} ({(resumeFile!.size / 1024).toFixed(1)} KB)</span>
              </div>
              <div className="py-3.5 grid grid-cols-3 gap-4">
                <span className="font-semibold text-slate-500">Applying for</span>
                <div className="col-span-2 flex flex-col gap-0.5">
                  <span className="font-semibold text-slate-900">{selectedJob.title}</span>
                  <span className="text-[10px] text-slate-500">{selectedJob.company}</span>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="flex-1 py-2 px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors text-center"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={triggerScreening}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors text-center shadow-sm"
              >
                Screen Candidate
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: LOADING / PROCESSING STATE */}
        {step === "screening" && (
          <div className="mx-auto max-w-md bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center gap-6">
            {/* Spinning Loader */}
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

        {/* STEP 4: SCREENING RESULTS */}
        {step === "results" && screeningResult && selectedJob && (
          <div className="flex flex-col gap-8">
            
            {/* Success alert message if running in mock/fallback mode */}
            {screeningResult.warning && (
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
                <span>⚠️</span>
                <span>{screeningResult.warning}</span>
              </div>
            )}

            {/* Candidate Header Summary card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Candidate Screening Result</span>
                <h2 className="text-xl font-bold text-slate-900">{form.name}</h2>
                <p className="text-xs text-slate-500">{selectedJob.title} — <span className="font-semibold">{selectedJob.company}</span></p>
              </div>

              {/* Score display block */}
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <div className="text-3xl font-extrabold text-slate-900">{screeningResult.match_score}<span className="text-sm font-medium text-slate-400">/100</span></div>
                  <span className={`text-[10px] px-2 py-0.5 mt-1 font-semibold rounded-full border ${getScoreRating(screeningResult.match_score).color}`}>
                    {getScoreRating(screeningResult.match_score).text}
                  </span>
                </div>
              </div>
            </div>

            {/* Results Grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Left Side: Fit & Strengths */}
              <div className="md:col-span-7 flex flex-col gap-6">
                
                {/* Overall Fit */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Overall Fit</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{screeningResult.overall_fit}</p>
                </div>

                {/* Strong Matches */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Strong Matches</h3>
                  {screeningResult.strong_matches && screeningResult.strong_matches.length > 0 ? (
                    <ul className="flex flex-col gap-3">
                      {screeningResult.strong_matches.map((strength, index) => (
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

              {/* Right Side: Gaps & Actions */}
              <div className="md:col-span-5 flex flex-col gap-6">
                
                {/* Gaps & Follow-up Questions */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Gaps & Interview Questions</h3>
                  
                  {screeningResult.gaps_and_questions && screeningResult.gaps_and_questions.length > 0 ? (
                    <div className="flex flex-col gap-5 divide-y divide-slate-100">
                      {screeningResult.gaps_and_questions.map((item, index) => (
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

                {/* Rescreen Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={resetAll}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors text-center shadow-sm"
                  >
                    Screen Another Candidate
                  </button>
                  <button
                    onClick={() => {
                      setStep("form");
                      setScreeningResult(null);
                    }}
                    className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors text-center"
                  >
                    Modify Candidate Info
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
