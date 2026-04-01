"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Users, Settings, LogOut, Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import { CandidateTracking } from "./CandidateTracking";
import { JobManagement } from "./JobManagement";
import { SettingsView } from "./SettingsView";

type View = "jobs" | "candidates" | "settings";

export function AdminDashboard() {
  const [activeView, setActiveView] = useState<View>("candidates");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navItems = [
    { id: "jobs" as View, label: "Job Management", icon: Briefcase },
    { id: "candidates" as View, label: "Candidate Tracking", icon: Users },
    { id: "settings" as View, label: "Settings", icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/careers/admin/login");
    } catch (err) {
      router.push("/careers/admin/login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <motion.aside
        animate={{ 
          width: isSidebarOpen ? (isDesktop ? 256 : 280) : (isDesktop ? 64 : 64),
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-secondary text-white flex flex-col h-screen overflow-hidden shrink-0"
      >
        <div className={`p-3 sm:p-4 border-b border-slate-600 flex items-center ${isSidebarOpen ? "justify-between" : "justify-center"}`}>
          <div className={`overflow-hidden transition-all duration-300 ${isSidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0"}`}>
            <h1 className="text-lg sm:text-xl font-header font-medium text-white whitespace-nowrap">Rebus Careers</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 whitespace-nowrap">Dashboard</p>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-600 rounded-lg transition-colors shrink-0"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const showText = isSidebarOpen;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  if (!isDesktop) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center rounded-lg transition-all duration-200 relative group ${
                  showText ? "gap-3 px-3 sm:px-4 justify-start" : "justify-center px-2"
                } py-2.5 sm:py-3 ${
                  isActive
                    ? "bg-[#3a506e] text-white"
                    : "text-slate-300 hover:bg-[#3a506e] hover:text-white"
                }`}
                title={!showText ? item.label : undefined}
              >
                <Icon size={18} className="sm:w-5 sm:h-5 shrink-0" />
                <span className={`font-sans font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${
                  showText ? "opacity-100" : "opacity-0 w-0"
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 sm:p-4 border-t border-slate-600 space-y-3">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all duration-200 relative group ${
              isSidebarOpen ? "gap-3 px-3 sm:px-4 justify-start" : "justify-center px-2"
            } py-2.5 sm:py-3`}
            title={!isSidebarOpen ? "Logout" : undefined}
          >
            <LogOut size={18} className="sm:w-5 sm:h-5 shrink-0" />
            <span className={`font-sans font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${
              isSidebarOpen ? "opacity-100" : "opacity-0 w-0"
            }`}>
              Logout
            </span>
          </button>
          <div className={`px-3 sm:px-4 py-2 text-xs text-slate-400 overflow-hidden transition-all duration-300 ${
            isSidebarOpen ? "opacity-100" : "opacity-0 h-0"
          }`}>
            © 2026 Rebus Holdings
          </div>
        </div>
      </motion.aside>

      <main className="flex-1 transition-all duration-300 overflow-x-hidden">
        <div className="p-3 sm:p-4 lg:p-6 xl:p-8 2xl:p-12 max-w-7xl 2xl:max-w-[1800px] mx-auto w-full">
          {activeView === "candidates" && (
            <CandidateTracking 
              jobIdFilter={selectedJobId}
              onClearFilter={() => setSelectedJobId(null)}
            />
          )}
          {activeView === "jobs" && (
            <JobManagement 
              onJobClick={(jobId) => {
                setSelectedJobId(jobId);
                setActiveView("candidates");
              }}
            />
          )}
          {activeView === "settings" && <SettingsView />}
        </div>
      </main>
    </div>
  );
}

