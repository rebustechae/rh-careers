"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Download, CheckCircle, Eye, XCircle, Clock, 
  Trash2, Edit, MoreVertical, AlertTriangle, X, Save,
  ChevronDown
} from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { Modal } from "@/app/components/ui/Modal";
import { DropdownMenu, DropdownMenuItem } from "@/app/components/ui/DropdownMenu";

type Candidate = {
  id: string;
  name: string;
  jobPosition: string;
  dateApplied: string;
  status: "Pending" | "Shortlisted" | "Accepted" | "Rejected";
  email: string;
  resumeUrl?: string;
  message?: string;
  note?: string;
};

export function CandidateDetailView() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;
  
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit & Delete States
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    if (candidates.length > 0 && candidateId) {
      const candidate = candidates.find((c) => c.id === candidateId);
      if (candidate) {
        setSelectedCandidate(candidate);
        setNote(candidate.note || "");
        setEditForm({ name: candidate.name, email: candidate.email });
      }
    }
  }, [candidates, candidateId]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/applications");
      const data = await res.json();
      setCandidates(data);
    } catch (err) {
      console.error("Failed to load candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCandidate = async (payload: Partial<Candidate>) => {
    if (!selectedCandidate) return;
    try {
      const res = await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedCandidate.id, ...payload }),
      });

      if (res.ok) {
        setCandidates(prev => prev.map(c => c.id === selectedCandidate.id ? { ...c, ...payload } : c));
        setSelectedCandidate(prev => prev ? { ...prev, ...payload } : null);
        setIsEditing(false);
      }
    } catch (err) {
      alert("Update failed");
    }
  };

  const handleDeleteCandidate = async () => {
    if (!selectedCandidate) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/applications?id=${selectedCandidate.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/careers/admin");
        router.refresh();
      }
    } catch (err) {
      alert("Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusUpdate = (id: string, newStatus: Candidate["status"]) => {
    handleUpdateCandidate({ status: newStatus });
  };

  const handleSaveNote = () => {
    setSavingNote(true);
    handleUpdateCandidate({ note }).then(() => setSavingNote(false));
  };

  const handleDownloadResume = async () => {
    if (!selectedCandidate?.resumeUrl) return;
    window.open(selectedCandidate.resumeUrl, "_blank");
  };

  if (loading) return <div className="p-20 text-center font-sans">Loading...</div>;
  if (!selectedCandidate) return <div className="p-20 text-center font-sans">No Candidate Selected</div>;

  const currentIndex = candidates.findIndex((c) => c.id === selectedCandidate.id);
  const nextCandidate = candidates[currentIndex + 1];
  const prevCandidate = candidates[currentIndex - 1];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Sidebar - List */}
      <div className="w-80 border-r border-slate-200 bg-white overflow-y-auto hidden lg:flex flex-col">
        <div className="p-4 border-b border-slate-200 shrink-0">
          <Button variant="outline" size="sm" onClick={() => router.push("/careers/admin")} className="w-full flex justify-center">
            <ArrowLeft size={16} className="mr-2" /> Back to List
          </Button>
        </div>
        <div className="p-2">
          {candidates.map((c) => (
            <div 
              key={c.id} 
              onClick={() => router.push(`/careers/admin/candidates/${c.id}`)}
              className={`p-3 rounded-lg cursor-pointer mb-1 transition-all ${selectedCandidate.id === c.id ? "bg-slate-100 border-l-4 border-slate-900" : "hover:bg-slate-50"}`}
            >
              <p className="font-bold text-sm text-slate-900">{c.name}</p>
              <p className="text-xs text-slate-500">{c.jobPosition}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between h-[73px]">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" disabled={!prevCandidate} onClick={() => router.push(`/careers/admin/candidates/${prevCandidate?.id}`)}>←</Button>
            <span className="text-sm text-slate-500">{currentIndex + 1} / {candidates.length}</span>
            <Button variant="outline" size="sm" disabled={!nextCandidate} onClick={() => router.push(`/careers/admin/candidates/${nextCandidate?.id}`)}>→</Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className='flex justify-center' onClick={handleDownloadResume}><Download size={16} className="mr-2" /> Download</Button>
            
            <DropdownMenu trigger={<Button variant="outline" size="sm"><MoreVertical size={16} /></Button>}>
              <DropdownMenuItem onClick={() => setIsEditing(true)}><Edit size={14} className="mr-2" /> Edit Details</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsDeleteModalOpen(true)} className="text-red-600"><Trash2 size={14} className="mr-2" /> Delete Application</DropdownMenuItem>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-hidden">
          <iframe src={`${selectedCandidate.resumeUrl}#toolbar=0`} className="w-full h-full rounded-xl border border-slate-200 shadow-inner bg-white" />
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-85 border-l border-slate-200 bg-white overflow-y-auto p-6 space-y-8">
        {/* Status Card */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">Application Status</label>
          <DropdownMenu trigger={
            <button className="w-full p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-400 transition-all gap-4">
              <Badge status={selectedCandidate.status} />
              <ChevronDown size={14} className="text-slate-400" />
            </button>
          }>
            <DropdownMenuItem onClick={() => handleStatusUpdate(selectedCandidate.id, "Shortlisted")}>Shortlist</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusUpdate(selectedCandidate.id, "Accepted")}>Accept</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusUpdate(selectedCandidate.id, "Rejected")}>Reject</DropdownMenuItem>
          </DropdownMenu>
        </div>

        {/* Edit/Contact Info */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-primary">Candidate Info</h3>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="text-xs text-secondary hover:underline">Edit</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="text-xs text-slate-400 hover:underline">Cancel</button>
                <button onClick={() => handleUpdateCandidate(editForm)} className="text-xs text-white font-bold bg-secondary p-2 rounded-lg hover:bg-primary/80">Save</button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
              <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="Full Name" />
              <input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full p-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="Email" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm"><p className="text-slate-400 text-[10px] uppercase font-bold">Name</p><p className="font-medium text-slate-900">{selectedCandidate.name}</p></div>
              <div className="text-sm"><p className="text-slate-400 text-[10px] uppercase font-bold">Email</p><a href={`mailto:${selectedCandidate.email}`} className="text-secondary hover:underline">{selectedCandidate.email}</a></div>
            </div>
          )}
        </div>

        {/* Private Notes */}
        <div className="pt-6 border-t border-slate-100">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">Internal Notes</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={5} className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition-all resize-none" placeholder="Add a private interview note..." />
          <Button onClick={handleSaveNote} disabled={savingNote} className="w-full mt-3" size="sm">
            {savingNote ? "Saving..." : "Update Note"}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Application">
        <div className="p-6">
          <div className="bg-red-50 text-red-700 p-4 rounded-xl flex gap-3 mb-6">
            <AlertTriangle className="shrink-0" />
            <p className="text-sm">Warning: This will permanently remove the application for <strong>{selectedCandidate.name}</strong> from your records. This cannot be undone.</p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Keep Application</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteCandidate} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}