import React from "react";
import { Radar, Play, Square, MessageSquare, Sun, Moon, Database } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { demoDirector } from "../demo/DemoDirector";

interface HeaderProps {
  referenceDate?: string;
  totalRecords?: number;
}

export const Header: React.FC<HeaderProps> = ({ referenceDate, totalRecords }) => {
  const demoMode = useAppStore((state) => state.demoMode);
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const speakerNotesOpen = useAppStore((state) => state.speakerNotesOpen);
  const setSpeakerNotesOpen = useAppStore((state) => state.setSpeakerNotesOpen);
  const setCsvModalOpen = useAppStore((state) => state.setCsvModalOpen);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="w-full bg-sky-950/80 dark:bg-sky-950/90 border-b border-slate-800/80 backdrop-blur-xl sticky top-0 z-40 px-5 py-3 transition-colors">
      <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand & Positioning */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Radar className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                FARE RADAR <span className="text-blue-400">PRO</span>
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 border border-blue-500/30 text-blue-300">
                PS-025 Data Science & Predictive Analytics
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-1 max-w-2xl font-normal mt-0.5">
              An explainable airfare intelligence dashboard that turns historical fare data into understandable price context.
            </p>
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Reference Date Badge */}
          {referenceDate && (
            <div className="hidden xl:flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>Ref Date: {referenceDate}</span>
              {totalRecords && <span className="text-slate-500">({totalRecords.toLocaleString()} obs)</span>}
            </div>
          )}

          {/* Upload CSV Inspector Trigger */}
          <button
            onClick={() => setCsvModalOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors flex items-center gap-1.5"
            title="Inspect or upload custom airfare CSV"
          >
            <span>Data Inspector</span>
          </button>

          {/* Speaker Notes Overlay Toggle */}
          <button
            onClick={() => setSpeakerNotesOpen(!speakerNotesOpen)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
              speakerNotesOpen
                ? "border-blue-500 bg-blue-500/20 text-blue-300"
                : "border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300"
            }`}
            title="Toggle Speaker Notes [N]"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Notes (N)</span>
          </button>

          {/* 30-Sec Demo Tour Button */}
          <button
            onClick={() => demoDirector.toggle()}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
              demoMode
                ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
            }`}
            title="Run 30-Second Presentation Tour [D]"
          >
            {demoMode ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Demo</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>🎬 Demo Mode (D)</span>
              </>
            )}
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Toggle Light / Dark mode"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-300" />}
          </button>
        </div>
      </div>
    </header>
  );
};

