"use client";

import { useState, useEffect } from "react";
import { Plus, Users, Edit2, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Toggle } from "@/app/components/ui/Toggle";
import { Sheet } from "@/app/components/ui/Sheet";
import { Modal } from "@/app/components/ui/Modal";
import { JobForm } from "./JobForm";
import { DropdownMenu, DropdownMenuItem } from "@/app/components/ui/DropdownMenu";

type Job = {
  id: string;
  title: string;
  department: string;
  location?: string;
  vacancies?: number;
  employment_type?: string;
  work_mode?: string;
  requirements?: string[];
  responsibilities?: string[];
  applicants: number;
  isActive: boolean;
  is_active?: boolean;
};

interface JobManagementProps {
  onJobClick?: (jobId: string) => void;
}

export function JobManagement({ onJobClick }: JobManagementProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({});
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; jobId: string | null; jobTitle: string }>({
    isOpen: false,
    jobId: null,
    jobTitle: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/jobs");
      if (!res.ok) {
        throw new Error("Failed to fetch jobs");
      }
      const data = await res.json();
      const transformedJobs = data.map((job: any) => ({
        id: job.id,
        title: job.title,
        department: job.department,
        location: job.location,
        vacancies: job.vacancies,
        employment_type: job.employment_type,
        work_mode: job.work_mode,
        requirements: job.requirements,
        responsibilities: job.responsibilities,
        applicants: 0,
        isActive: job.is_active ?? job.isActive ?? true,
      }));
      setJobs(transformedJobs);
      await fetchApplicantCounts(transformedJobs);
    } catch (err: any) {
      setError(err.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicantCounts = async (jobsToUpdate?: Job[]) => {
    try {
      const res = await fetch("/api/admin/applications/stats");
      if (res.ok) {
        const counts = await res.json();
        setApplicantCounts(counts);
        const jobsToProcess = jobsToUpdate || jobs;
        setJobs(
          jobsToProcess.map((job) => ({
            ...job,
            applicants: counts[job.id] || 0,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch applicant counts:", err);
    }
  };

  const handleToggleJob = async (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    const newStatus = !job.isActive;
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newStatus }),
      });

      if (res.ok) {
        const updatedJob = await res.json();
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId ? { ...j, isActive: updatedJob.is_active ?? newStatus } : j
          )
        );
      } else {
        let errorMessage = "Failed to update job status";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      alert(err.message || "Failed to update job status. Please try again.");
    }
  };

  const handleAddJob = async (newJob: {
    title: string;
    department: string;
    location: string;
    vacancies: number;
    employment_type: string;
    work_mode: string;
    requirements: string[];
    responsibilities: string[];
    isActive: boolean;
  }) => {
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newJob.title,
          department: newJob.department,
          location: newJob.location,
          vacancies: newJob.vacancies,
          employment_type: newJob.employment_type,
          work_mode: newJob.work_mode,
          requirements: newJob.requirements,
          responsibilities: newJob.responsibilities,
          is_active: newJob.isActive,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to create job");
      }

      const createdJob = await res.json();
      setJobs((prev) => [
        {
          id: createdJob.id,
          title: createdJob.title,
          department: createdJob.department,
          description: createdJob.description,
          applicants: 0,
          isActive: createdJob.is_active ?? true,
        },
        ...prev,
      ]);
      setIsSheetOpen(false);
      setEditingJob(null);
    } catch (err: any) {
      alert(err.message || "Failed to create job. Please try again.");
    }
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setIsSheetOpen(true);
  };

  const handleUpdateJob = async (updatedJob: {
    title: string;
    department: string;
    location: string;
    vacancies: number;
    employment_type: string;
    work_mode: string;
    requirements: string[];
    responsibilities: string[];
    isActive: boolean;
  }) => {
    if (!editingJob) return;

    try {
      const res = await fetch(`/api/admin/jobs/${editingJob.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updatedJob.title,
          department: updatedJob.department,
          location: updatedJob.location,
          vacancies: updatedJob.vacancies,
          employment_type: updatedJob.employment_type,
          work_mode: updatedJob.work_mode,
          requirements: updatedJob.requirements,
          responsibilities: updatedJob.responsibilities,
          is_active: updatedJob.isActive,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to update job");
      }

      const updated = await res.json();
      setJobs((prev) =>
        prev.map((j) =>
          j.id === editingJob.id
            ? {
                ...j,
                title: updated.title,
                department: updated.department,
                location: updated.location,
                vacancies: updated.vacancies,
                employment_type: updated.employment_type,
                work_mode: updated.work_mode,
                requirements: updated.requirements,
                responsibilities: updated.responsibilities,
                isActive: updated.is_active ?? j.isActive,
              }
            : j
        )
      );
      setIsSheetOpen(false);
      setEditingJob(null);
    } catch (err: any) {
      alert(err.message || "Failed to update job. Please try again.");
    }
  };

  const handleDeleteClick = (job: Job) => {
    setDeleteModal({
      isOpen: true,
      jobId: job.id,
      jobTitle: job.title,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.jobId) return;

    try {
      const res = await fetch(`/api/admin/jobs/${deleteModal.jobId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to delete job");
      }

      setJobs((prev) => prev.filter((j) => j.id !== deleteModal.jobId));
      setDeleteModal({ isOpen: false, jobId: null, jobTitle: "" });
    } catch (err: any) {
      alert(err.message || "Failed to delete job. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          <p className="font-sans text-slate-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 font-sans">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-header text-primary">
            Job Management
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-secondary mt-1">
            Manage active job postings and listings ({jobs.length} total)
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingJob(null);
            setIsSheetOpen(true);
          }}
          className="flex items-center gap-2 w-full sm:w-auto "
          size="md"
          variant="primary"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add New Job</span>
          <span className="sm:hidden">Add Job</span>
        </Button>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 sm:p-12 text-center">
          <p className="text-sm sm:text-base text-slate-600 font-sans">No jobs found. Create your first job posting.</p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 ${isSheetOpen ? 'pointer-events-none' : ''}`}>
        {jobs.map((job) => (
          <div
            key={job.id}
            onClick={() => onJobClick?.(job.id)}
            className={`bg-white rounded-lg border border-slate-200 p-3 sm:p-4 lg:p-5 hover:shadow-lg transition-shadow ${
              onJobClick ? "cursor-pointer" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="text-base sm:text-lg lg:text-xl font-header font-medium text-primary mb-1 line-clamp-2">
                  {job.title}
                </h3>
                <p className="text-xs sm:text-sm font-sans text-primary/60">
                  {job.department}
                </p>
              </div>
              <DropdownMenu
                trigger={
                  <button 
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <MoreVertical size={16} className="text-slate-600" />
                  </button>
                }
              >
                <DropdownMenuItem onClick={() => handleEditJob(job)}>
                  <div className="flex items-center gap-2">
                    <Edit2 size={14} />
                    Edit Job
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(job)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <div className="flex items-center gap-2">
                    <Trash2 size={14} />
                    Delete Job
                  </div>
                </DropdownMenuItem>
              </DropdownMenu>
            </div>

            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 text-slate-600">
                <Users size={14} className="sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-sans">
                  {job.applicants} applicant{job.applicants !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-200">
              <span className="text-xs sm:text-sm font-sans text-slate-500">
                {job.isActive ? "Active" : "Inactive"}
              </span>
              <div onClick={(e) => e.stopPropagation()}>
                <Toggle
                  checked={job.isActive}
                  onChange={() => handleToggleJob(job.id)}
                />
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      <Sheet
        isOpen={isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false);
          setEditingJob(null);
        }}
        title={editingJob ? "Edit Job" : "Add New Job"}
      >
        <JobForm
          onSubmit={editingJob ? handleUpdateJob : handleAddJob}
          onCancel={() => {
            setIsSheetOpen(false);
            setEditingJob(null);
          }}
          initialData={editingJob ? {
            title: editingJob.title,
            department: editingJob.department,
            location: editingJob.location || "",
            vacancies: editingJob.vacancies || 1,
            employment_type: editingJob.employment_type || "",
            work_mode: editingJob.work_mode || "",
            requirements: editingJob.requirements || [""],
            responsibilities: editingJob.responsibilities || [""],
            isActive: editingJob.isActive,
          } : undefined}
          isEdit={!!editingJob}
        />
      </Sheet>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, jobId: null, jobTitle: "" })}
        title="Delete Job Posting"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false, jobId: null, jobTitle: "" })}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="font-sans text-slate-700">
          Are you sure you want to delete <strong>"{deleteModal.jobTitle}"</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

