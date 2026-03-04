"use client";

import { useEffect, useState, DragEvent, useRef } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, Upload, FileText, X, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function JobDetailPage() {
  const { id } = useParams();
  const [job, setJob] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    fetch(`/api/jobs/${id}`, { signal: abortControllerRef.current.signal })
      .then((res) => res.json())
      .then((data) => setJob(data))
      .catch((err) => {
        if (err.name !== "AbortError") console.error("Fetch error:", err);
      });

    return () => abortControllerRef.current?.abort();
  }, [id]);
 
  const validateAndSetFile = (file: File) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Please upload a PDF or Word document.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please upload a file under 5MB.");
      return;
    }
    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplication = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile || uploading) return;

    setUploading(true);

    const formData = new FormData(e.currentTarget);
    const fileExt = selectedFile.name.split(".").pop();

    const timestamp = Date.now();
    const fileName = `${timestamp}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;
    const filePath = `${id}/${fileName}`; 

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(filePath, selectedFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setUploading(false);
      return alert(`Upload failed: ${uploadError.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("resumes").getPublicUrl(filePath);

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: id,
          full_name: formData.get("full_name"),
          email: formData.get("email"),
          resume_url: publicUrl,
          message: formData.get("message"),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        throw new Error("Application failed to save");
      }
    } catch (err) {
      alert("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (!job)
    return (
      <main className="min-h-screen bg-white py-24 px-6 md:px-12 animate-pulse">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 w-64 bg-slate-200 rounded mb-12" />
          <div className="grid lg:grid-cols-[300px_1fr] gap-16">
            <aside className="space-y-8 border-r border-slate-100 pr-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-20 bg-slate-100 rounded" />
                  <div className="h-6 w-32 bg-slate-200 rounded" />
                </div>
              ))}
            </aside>
            <section>
              <div className="flex gap-12 border-b border-slate-100 mb-8 pb-4">
                <div className="h-6 w-24 bg-slate-200 rounded" />
                <div className="h-6 w-24 bg-slate-100 rounded" />
              </div>
              <div className="space-y-6">
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="h-4 w-5/6 bg-slate-100 rounded" />
                <div className="h-40 w-full bg-slate-50 rounded-xl" />
              </div>
            </section>
          </div>
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-white px-6 py-6 md:px-12 md:py-12">
      <div className="max-w-7xl mx-auto pt-6">
        <div className="mb-12 flex justify-center">
          <img
            src="/images/logo.png"
            alt="Rebus Holdings logo"
            className="w-36 h-auto"
          />
        </div>
        <Link
          href="/careers"
          className="flex items-center gap-2 text-primary mb-8 group"
        >
          <ChevronLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-header text-2xl">{job.title}</span>
        </Link>

        <div className="grid lg:grid-cols-[300px_1fr] gap-16">
          <aside className="space-y-4 border-r border-slate-100 pr-8 bg-slate-50 p-6">
            <InfoBlock label="Location" value={job.location} />
            <InfoBlock label="Employment Type" value={job.employment_type} />
            <InfoBlock label="Mode" value={job.work_mode} />
            <InfoBlock label="Department" value={job.department} />
          </aside>

          <section>
            <div className="flex gap-12 border-b border-slate-100 mb-8">
              {["overview", "application"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 text-lg font-sans font-semibold capitalize relative transition-colors ${
                    activeTab === tab
                      ? "text-primary"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in slide-in-from-left duration-300" />
                  )}
                </button>
              ))}
            </div>

            {activeTab === "overview" ? (
              <div className="space-y-12 animate-in fade-in duration-500">
                <section>
                  <h4 className="text-primary font-semibold text-xl mb-6 flex items-center gap-2">
                    <div className="h-8 w-1 bg-primary" />
                    Key Responsibilities
                  </h4>
                  {job.responsibilities && job.responsibilities.length > 0 ? (
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 list-disc pl-5">
                      {job.responsibilities.map((item: string, i: number) => (
                        <li
                          key={i}
                          className="text-slate-600 font-sans text-sm leading-relaxed"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 italic text-sm">
                      No specific responsibilities listed.
                    </p>
                  )}
                </section>

                <section>
                  <h4 className="text-primary font-semibold text-xl mb-6 flex items-center gap-2">
                    <div className="h-8 w-1 bg-primary" />
                    Candidate Requirements
                  </h4>
                  {job.requirements && job.requirements.length > 0 ? (
                    <ul className="space-y-3 list-disc pl-5">
                      {job.requirements.map((req: string, i: number) => (
                        <li
                          key={i}
                          className="text-slate-600 font-sans text-sm"
                        >
                          {req}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 italic text-sm">
                      No specific requirements listed.
                    </p>
                  )}
                </section>
              </div>
            ) : (
              <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                {submitted ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-primary/20">
                    <BadgeCheck className="size-16 text-green-500 mx-auto mb-4" />
                    <h3 className="font-header text-2xl text-primary mb-2">
                      Application Received!
                    </h3>
                    <p className="text-slate-500">
                      We will review your profile and get back to you soon.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleApplication}
                    className="space-y-4 font-sans"
                  >
                    <div className="space-y-1.5">
                      <label
                        htmlFor="full_name"
                        className="text-sm font-semibold text-slate-700 ml-1"
                      >
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="full_name"
                        name="full_name"
                        placeholder="e.g. John Doe"
                        required
                        className="w-full p-3 border border-slate-200 rounded-lg outline-primary transition-all mt-2"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="email"
                        className="text-sm font-semibold text-slate-700 ml-1"
                      >
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        required
                        className="w-full p-3 border border-slate-200 rounded-lg outline-primary transition-all mt-2"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700 ml-1">
                        Curriculum Vitae (CV) or Resume{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        {!selectedFile ? (
                          <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed p-8 text-center rounded-lg transition-all cursor-pointer relative mt-2 ${
                              isDragging
                                ? "border-primary bg-primary/5 scale-[1.01]"
                                : "border-slate-200 group-hover:border-primary"
                            }`}
                          >
                            <input
                              id="resume"
                              name="resume"
                              type="file"
                              required
                              accept=".pdf,.doc,.docx"
                              onChange={handleFileChange}
                              className="absolute inset-0 opacity-0 cursor-pointer mt-2"
                            />
                            <Upload
                              className={`mx-auto mb-2 transition-colors ${
                                isDragging
                                  ? "text-primary"
                                  : "text-slate-400 group-hover:text-primary"
                              }`}
                            />
                            <p className="text-sm text-slate-500 font-medium">
                              {isDragging
                                ? "Drop resume here"
                                : "Upload or drag CV here"}
                              <span className="block text-xs mt-1">
                                (.pdf, .doc, .docx max 5MB)
                              </span>
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-4 bg-slate-50 border border-primary/30 rounded-lg animate-in fade-in zoom-in duration-200 mt-2">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <FileText className="text-primary size-6" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-primary truncate max-w-[200px]">
                                  {selectedFile.name}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {(selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                                  MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedFile(null)}
                              className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="message"
                        className="text-sm font-semibold text-slate-700 ml-1"
                      >
                        Cover Letter / Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        placeholder="Tell us why you're a good fit..."
                        rows={4}
                        className="w-full p-3 border border-slate-200 rounded-lg outline-primary transition-all mt-2"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={uploading}
                      className="w-full bg-primary text-white py-4 rounded-xl font-semibold hover:bg-primary/90 disabled:bg-slate-300 transition-all active:scale-[0.98]"
                    >
                      {uploading ? "Uploading..." : "Submit Application"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase text-slate-400 font-semibold font-sans">
        {label}
      </span>
      <span className="text-primary/90 font-sans font-medium">
        {value || "N/A"}
      </span>
    </div>
  );
}
