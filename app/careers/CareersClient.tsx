"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin, Briefcase, Search, FilterX } from "lucide-react";
import { Job } from "@/app/types";
import { API_ENDPOINTS } from "@/app/lib/constants";

/**
 * CareersClient Component
 * Displays available job listings with filtering by department and location
 */
export default function CareersClient() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState("All Departments");
  const [selectedLoc, setSelectedLoc] = useState("All Locations");

  useEffect(() => {
    fetchJobs();
  }, []);

  /**
   * Fetches all active jobs from the API
   */
  const fetchJobs = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.JOBS);
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Dynamically generates unique departments from jobs
   */
  const departments = useMemo(
    () => ["All Departments", ...new Set(jobs.map((j) => j.department))],
    [jobs]
  );

  /**
   * Dynamically generates unique locations from jobs
   */
  const locations = useMemo(
    () => ["All Locations", ...new Set(jobs.map((j) => j.location))],
    [jobs]
  );

  /**
   * Filters jobs based on selected department and location
   */
  const filteredJobs = jobs.filter((job) => {
    const matchDept =
      selectedDept === "All Departments" || job.department === selectedDept;
    const matchLoc =
      selectedLoc === "All Locations" || job.location === selectedLoc;
    return matchDept && matchLoc;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FAFAFA] to-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="font-sans text-slate-500 animate-pulse">
            Loading opportunities...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen bg-gradient-to-b from-[#FAFAFA] to-[#F8FAFC] py-8 md:py-12 px-4 sm:px-6"
      data-theme="light"
    >
      <div className="max-w-7xl mx-auto">
        {/* Logo Section */}
        <div className="mb-8 md:mb-12 flex justify-center">
          <img
            src="/images/logo.png"
            alt="Rebus Holdings logo"
            className="w-28 md:w-36 h-auto"
          />
        </div>

        {/* Header Section */}
        <header className="mb-8 md:mb-12 px-0 md:px-12 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-header text-3xl md:text-4xl text-primary mb-3">
              Open Positions
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 font-sans">
              <Briefcase size={18} className="text-[#425B7D]" />
              <span className="text-sm md:text-base">
                {filteredJobs.length} openings showing
              </span>
            </div>
          </motion.div>
        </header>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-10 p-4 md:p-6 bg-white rounded-2xl border border-slate-100 shadow-sm mx-0 md:mx-12">
          <div className="flex-1 w-full">
            <label className="block text-[10px] md:text-xs font-bold text-primary/80 uppercase mb-2 ml-1">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-sans text-sm text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer appearance-none"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 w-full">
            <label className="block text-[10px] md:text-xs font-bold text-primary/80 uppercase mb-2 ml-1">
              Location
            </label>
            <select
              value={selectedLoc}
              onChange={(e) => setSelectedLoc(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-sans text-sm text-primary focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer appearance-none"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {(selectedDept !== "All Departments" ||
            selectedLoc !== "All Locations") && (
            <div className="flex items-end justify-center">
              <button
                onClick={() => {
                  setSelectedDept("All Departments");
                  setSelectedLoc("All Locations");
                }}
                className="w-full md:w-auto p-3 text-sm font-semibold text-primary hover:text-red-500 transition-colors flex items-center justify-center gap-2"
              >
                <FilterX size={16} />
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-0 md:px-12">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <motion.div
                key={job.id}
                layout
                className="group bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full"
              >
                <div>
                  <h3 className="font-header text-primary text-lg mb-3 leading-tight group-hover:text-primary/80 transition-colors">
                    {job.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-secondary text-white text-[10px] font-semibold uppercase px-2 py-1 rounded">
                      {job.department}
                    </span>
                    <span className="text-primary text-[10px] font-medium uppercase px-2 py-1">
                      {job.vacancies} {job.vacancies > 1 ? "Vacancies" : "Vacancy"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-primary/70 text-xs md:text-sm font-sans mb-8">
                    <MapPin size={14} className="shrink-0" />
                    <span>
                      {job.location} • {job.work_mode}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/careers/${job.id}`}
                  className="w-full bg-primary text-white text-center py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  View & Apply
                </Link>
              </motion.div>
            ))
          ) : (
            <motion.div className="col-span-full text-center py-16 md:py-24 bg-white rounded-3xl border border-dashed border-slate-200">
              <Search className="mx-auto text-slate-300 mb-4" size={40} />
              <h3 className="font-header text-xl md:text-2xl text-primary px-4">
                No positions match your filters
              </h3>
            </motion.div>
          )}
        </div>

        <footer className="mt-16 border-t border-gray-200 py-6 flex justify-center">
          <span className="text-xs md:text-sm text-gray-400">
            © 2026 Rebus Holdings
          </span>
        </footer>
      </div>
    </main>
  );
}
