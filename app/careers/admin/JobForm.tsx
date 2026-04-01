"use client";

import { useState, FormEvent } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/app/components/ui/Button";

type JobFormData = {
  title: string;
  department: string;
  location: string;
  vacancies: number;
  employment_type: string;
  work_mode: string;
  requirements: string[];
  responsibilities: string[];
};

type JobFormProps = {
  onSubmit: (job: JobFormData & { isActive: boolean }) => void;
  onCancel: () => void;
  initialData?: Partial<JobFormData & { isActive: boolean }>;
  isEdit?: boolean;
};

export function JobForm({ onSubmit, onCancel, initialData, isEdit = false }: JobFormProps) {
  const [step, setStep] = useState(1);

  const normalizeList = (list: unknown): string[] => {
    if (!Array.isArray(list)) return [""];
    const normalized = list
      .map((v) => (typeof v === "string" ? v : v == null ? "" : String(v)))
      .map((v) => v.trimEnd());
    return normalized.length > 0 ? normalized : [""];
  };

  const [formData, setFormData] = useState<JobFormData>({
    title: initialData?.title || "",
    department: initialData?.department || "",
    location: initialData?.location || "",
    vacancies: initialData?.vacancies || 1,
    employment_type: initialData?.employment_type || "",
    work_mode: initialData?.work_mode || "",
    requirements: normalizeList(initialData?.requirements),
    responsibilities: normalizeList(initialData?.responsibilities),
  });

  const departments = [
    "Engineering & Contracting",
    "Technology Solutions",
    "Projects Management",
    "Safety and Security",
  ];

  const employmentTypes = [
    "Full-time",
    "Part-time",
    "Contract",
    "Temporary",
  ];

  const workModes = [
    "Remote",
    "On-site",
    "Hybrid",
  ];

  const emirates = [
    "Abu Dhabi",
    "Dubai",
    "Sharjah",
    "Ajman",
    "Umm Al Quwain",
    "Ras Al Khaimah",
    "Fujairah",
  ];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (step === 3) {
      const filteredData = {
        ...formData,
        requirements: formData.requirements.filter((r) => (r ?? "").trim() !== ""),
        responsibilities: formData.responsibilities.filter((r) => (r ?? "").trim() !== ""),
        isActive: true,
      };
      onSubmit(filteredData);
    }
  };

  const updateField = (field: keyof JobFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    if (step === 1) return formData.title.trim() !== "" && formData.department !== "";
    if (step === 2) return formData.location.trim() !== "" && formData.employment_type !== "" && formData.work_mode !== "";
    if (step === 3) {
      const hasRequirement = formData.requirements.some((r) => (r ?? "").trim() !== "");
      const hasResponsibility = formData.responsibilities.some((r) => (r ?? "").trim() !== "");
      return hasRequirement || hasResponsibility;
    }
    return false;
  };

  const addRequirement = () => {
    setFormData((prev) => ({
      ...prev,
      requirements: [...prev.requirements, ""],
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => (i === index ? value : req)),
    }));
  };

  const removeRequirement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const addResponsibility = () => {
    setFormData((prev) => ({
      ...prev,
      responsibilities: [...prev.responsibilities, ""],
    }));
  };

  const updateResponsibility = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      responsibilities: prev.responsibilities.map((resp, i) => (i === index ? value : resp)),
    }));
  };

  const removeResponsibility = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      responsibilities: prev.responsibilities.filter((_, i) => i !== index),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1 w-full sm:w-auto">
            <div className="flex items-center">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-sans font-medium text-xs sm:text-sm ${
                  s === step
                    ? "bg-slate-900 text-white"
                    : s < step
                    ? "bg-slate-700 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {s < step ? "✓" : s}
              </div>
              <span
                className={`ml-2 text-xs sm:text-sm font-sans ${
                  s === step ? "text-slate-900 font-medium" : "text-slate-600"
                }`}
              >
                <span className="hidden sm:inline">{s === 1 ? "Basic Info" : s === 2 ? "Details" : "Description"}</span>
                <span className="sm:hidden">{s === 1 ? "Basic" : s === 2 ? "Details" : "Desc"}</span>
              </span>
            </div>
            {s < 3 && (
              <ChevronRight
                size={14}
                className="mx-2 sm:mx-4 text-slate-400 flex-shrink-0 hidden sm:block"
              />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-sans font-medium text-slate-900 mb-2">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g., Senior Software Engineer"
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-sans"
              required
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-sans font-medium text-slate-900 mb-2">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.department}
              onChange={(e) => updateField("department", e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-sans bg-white"
              required
            >
              <option value="">Select a department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-sans font-medium text-slate-900 mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.location}
              onChange={(e) => updateField("location", e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-sans bg-white"
              required
            >
              <option value="">Select an emirate</option>
              {emirates.map((emirate) => (
                <option key={emirate} value={emirate}>
                  {emirate}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-sans font-medium text-slate-900 mb-2">
                Vacancies
              </label>
              <input
                type="number"
                min="1"
                value={formData.vacancies}
                onChange={(e) => updateField("vacancies", parseInt(e.target.value) || 1)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-sans"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-sans font-medium text-slate-900 mb-2">
                Employment Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.employment_type}
                onChange={(e) => updateField("employment_type", e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-sans bg-white"
                required
              >
                <option value="">Select type</option>
                {employmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-sans font-medium text-slate-900 mb-2">
              Work Mode <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.work_mode}
              onChange={(e) => updateField("work_mode", e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-sans bg-white"
              required
            >
              <option value="">Select work mode</option>
              {workModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-sans font-medium text-slate-900 mb-2">
              Requirements 
            </label>
            {formData.requirements.map((req, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={req}
                  onChange={(e) => updateRequirement(index, e.target.value)}
                  placeholder={`Requirement ${index + 1}`}
                  className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-sans"
                />
                {formData.requirements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addRequirement}
              className="text-sm text-slate-600 hover:text-slate-900 font-sans"
            >
              + Add Requirement
            </button>
          </div>
          <div>
            <label className="block text-sm font-sans font-medium text-slate-900 mb-2">
              Responsibilities
            </label>
            {formData.responsibilities.map((resp, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={resp}
                  onChange={(e) => updateResponsibility(index, e.target.value)}
                  placeholder={`Responsibility ${index + 1}`}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-sans"
                />
                {formData.responsibilities.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeResponsibility(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addResponsibility}
              className="text-sm text-slate-600 hover:text-slate-900 font-sans"
            >
              + Add Responsibility
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-3 sm:pt-4 border-t border-slate-200 gap-3">
        <div>
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 w-full sm:w-auto"
              size="sm"
            >
              <ChevronLeft size={16} />
              Previous
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button type="button" variant="ghost" onClick={onCancel} className="flex-1 sm:flex-initial" size="sm">
            Cancel
          </Button>
          {step < 3 ? (
            <Button
              type="button"
              onMouseDown={(e) => {
                // Prevent "click-through" where the Next click lands on the newly rendered
                // submit button (common when step 3 is already valid in edit mode).
                e.preventDefault();
                setStep((s) => s + 1);
              }}
              disabled={!canProceed()}
              className="flex items-center gap-2 flex-1 sm:flex-initial"
              size="sm"
            >
              Next
              <ChevronRight size={16} />
            </Button>
          ) : (
            <Button type="submit" disabled={!canProceed()} className="flex-1 sm:flex-initial" size="sm">
              {isEdit ? "Update Job" : "Create Job"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

