"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";
import { Search, Download, MoreVertical, Eye, FileText, Trash2, CheckCircle, XCircle, Users, CheckCircle2, Clock, X } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { Modal } from "@/app/components/ui/Modal";
import { DropdownMenu, DropdownMenuItem } from "@/app/components/ui/DropdownMenu";
import { ResumeViewerModal } from "@/app/components/ui/ResumeViewerModal";

// --- Toast Component ---
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in fade-in slide-in-from-bottom-5 duration-300 ${
      type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
    }`}>
      {type === "success" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
      <p className="text-sm font-medium font-sans">{message}</p>
      <button onClick={onClose} className="ml-2 hover:opacity-70"><X size={14} /></button>
    </div>
  );
}

type Candidate = {
  id: string;
  name: string;
  jobPosition: string;
  dateApplied: string;
  status: "Pending" | "Shortlisted" | "Accepted" | "Rejected";
  email?: string;
  resumeUrl?: string;
  message?: string;
};

const columnHelper = createColumnHelper<Candidate>();

interface CandidateTrackingProps {
  jobIdFilter?: string | null;
  onClearFilter?: () => void;
}

export function CandidateTracking({ jobIdFilter, onClearFilter }: CandidateTrackingProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filteredJobTitle, setFilteredJobTitle] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; candidateId: string | null; candidateName: string }>({
    isOpen: false,
    candidateId: null,
    candidateName: "",
  });
  
  const [resumeViewerModal, setResumeViewerModal] = useState<{ isOpen: boolean; candidate: Candidate | null }>({
    isOpen: false,
    candidate: null,
  });

  useEffect(() => {
    fetchCandidates();
  }, [jobIdFilter]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const url = jobIdFilter ? `/api/admin/applications?jobId=${jobIdFilter}` : "/api/admin/applications";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch applications");
      const candidates = await res.json();
      setData(candidates);
      
      if (jobIdFilter && candidates.length > 0) {
        setFilteredJobTitle(candidates[0].jobPosition);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleViewResume = (candidate: Candidate) => {
    if (candidate.resumeUrl) {
      setResumeViewerModal({ isOpen: true, candidate });
    }
  };

  const handleDownloadResume = async () => {
    if (!resumeViewerModal.candidate?.resumeUrl) return;
    try {
      const response = await fetch(resumeViewerModal.candidate.resumeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${resumeViewerModal.candidate.name.replace(/\s+/g, "_")}_Resume.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast("Failed to download resume.", "error");
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: "Pending" | "Shortlisted" | "Accepted" | "Rejected") => {
    try {
      const res = await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        if (resumeViewerModal.candidate?.id === id) setResumeViewerModal({ isOpen: false, candidate: null });
        setData((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)));
        showToast(`Candidate marked as ${newStatus}. Notification sent.`, "success");
      } else {
        showToast("Update failed. Please try again.", "error");
      }
    } catch (err) {
      showToast("Network error occurred.", "error");
    }
  };

  const handleDeleteClick = (candidate: Candidate) => {
    setDeleteModal({
      isOpen: true,
      candidateId: candidate.id,
      candidateName: candidate.name,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.candidateId) return;
    try {
      const res = await fetch(`/api/admin/applications?id=${deleteModal.candidateId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setData((prev) => prev.filter((c) => c.id !== deleteModal.candidateId));
      setDeleteModal({ isOpen: false, candidateId: null, candidateName: "" });
      showToast("Application deleted successfully.", "success");
    } catch (err) {
      showToast("Failed to delete application.", "error");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Candidate Name", "Job Position", "Date Applied", "Status"];
    const rows = filteredData.map((c) => [
      c.name,
      c.jobPosition,
      new Date(c.dateApplied).toLocaleDateString(),
      c.status,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `candidates_${new Date().toISOString().split("T")[0]}.csv`);
    link.click();
  };

  // --- Table Columns ---
  const columns = useMemo(() => [
    columnHelper.accessor("name", {
      header: "Candidate Name",
      cell: (info) => <span className="font-sans font-medium text-slate-900">{info.getValue()}</span>,
    }),
    columnHelper.accessor("jobPosition", {
      header: "Job Position",
      cell: (info) => <span className="font-sans text-slate-700">{info.getValue()}</span>,
    }),
    columnHelper.accessor("dateApplied", {
      header: "Date Applied",
      cell: (info) => (
        <span className="font-sans text-slate-600">
          {new Date(info.getValue()).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
        </span>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => <Badge status={info.getValue()} />,
    }),
    columnHelper.display({
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: (info) => {
        const candidate = info.row.original;
        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu trigger={<button className="p-1.5 hover:bg-slate-100 rounded-lg"><MoreVertical size={16} /></button>}>
              <DropdownMenuItem onClick={() => handleViewResume(candidate)}>
                <div className="flex items-center gap-2"><FileText size={14} /> View Resume</div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusUpdate(candidate.id, "Shortlisted")}>
                <div className="flex items-center gap-2"><Eye size={14} /> Shortlist</div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusUpdate(candidate.id, "Accepted")} className="text-green-600">
                <div className="flex items-center gap-2"><CheckCircle size={14} /> Accept</div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusUpdate(candidate.id, "Rejected")} className="text-red-600">
                <div className="flex items-center gap-2"><XCircle size={14} /> Reject</div>
              </DropdownMenuItem>
              <div className="border-t my-1" />
              <DropdownMenuItem onClick={() => handleDeleteClick(candidate)} className="text-red-600">
                <div className="flex items-center gap-2"><Trash2 size={14} /> Delete</div>
              </DropdownMenuItem>
            </DropdownMenu>
          </div>
        );
      },
    }),
  ], []);

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return data.filter(c => c.name.toLowerCase().includes(query) || c.jobPosition.toLowerCase().includes(query));
  }, [data, searchQuery]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          <p className="font-sans text-slate-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-header font-bold text-slate-900">Candidate Tracking</h2>
          <p className="text-slate-600">Total Applicants: {filteredData.length}</p>
        </div>
        <Button onClick={handleExportCSV} size="sm" className="flex justify-center gap-2 px-4 py-2"><Download size={16} /> <span>Export CSV</span></Button>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search candidates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <th key={header.id} className="px-4 py-4 text-left text-xs font-semibold uppercase text-slate-700">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-200">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} onClick={() => router.push(`/careers/admin/candidates/${row.original.id}`)} className="hover:bg-slate-50 cursor-pointer">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals & Toast */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, candidateId: null, candidateName: "" })}
        title="Delete Candidate"
        footer={<Button className="bg-red-600" onClick={handleDeleteConfirm}>Confirm Delete</Button>}
      >
        <p>Permanently delete <strong>{deleteModal.candidateName}</strong>?</p>
      </Modal>

      {resumeViewerModal.candidate && (
        <ResumeViewerModal
          isOpen={resumeViewerModal.isOpen}
          onClose={() => setResumeViewerModal({ isOpen: false, candidate: null })}
          candidateName={resumeViewerModal.candidate.name}
          resumeUrl={resumeViewerModal.candidate.resumeUrl || ""}
          currentStatus={resumeViewerModal.candidate.status}
          onStatusUpdate={(status) => handleStatusUpdate(resumeViewerModal.candidate!.id, status)}
          onDownload={handleDownloadResume}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}