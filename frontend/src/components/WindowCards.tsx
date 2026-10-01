import React from "react";
import { Calendar, Check } from "lucide-react";
import { WindowStatistics } from "../api/client";
import { useAppStore } from "../store/useAppStore";

interface WindowCardsProps {
  stats30?: WindowStatistics;
  stats60?: WindowStatistics;
  stats90?: WindowStatistics;
}

export const WindowCards: React.FC<WindowCardsProps> = ({ stats30, stats60, stats90 }) => {
  const selectedWindow = useAppStore((state) => state.selectedWindow);
  const setSelectedWindow = useAppStore((state) => state.setSelectedWindow);

  const windows = [
    { days: 30 as const, stats: stats30, label: "30-Day Window", desc: "Short-term momentum & seasonal shifts" },
    { days: 60 as const, stats: stats60, label: "60-Day Window", desc: "Balanced quarterly route behavior" },
    { days: 90 as const, stats: stats90, label: "90-Day Window", desc: "Macro baseline across multiple months" },
  ];

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-400" />
            Multi-Window Comparative Analysis (30 / 60 / 90 Days)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Observe how median and price corridors stabilize as observation horizons expand
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {windows.map(({ days, stats, label, desc }) => {
          const isActive = selectedWindow === days;
          return (
            <div
              key={days}
              onClick={() => setSelectedWindow(days)}
              className={`rounded-xl p-4 border transition-all cursor-pointer relative ${
                isActive
                  ? "bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/40"
                  : "bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white tracking-wide">{label}</span>
                {isActive && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3" /> Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{desc}</p>

              {stats ? (
                <div className="mt-3.5 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Median Fare:</span>
                    <span className="text-white font-bold">₹{stats.median.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Mean (Average):</span>
                    <span className="text-slate-300">₹{stats.mean.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">IQR (Q1–Q3):</span>
                    <span className="text-slate-300">₹{stats.q1.toLocaleString()} – ₹{stats.q3.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800 text-[11px]">
                    <span className="text-slate-500 font-sans">Range [Min–Max]:</span>
                    <span className="text-slate-400">₹{stats.min.toLocaleString()} – ₹{stats.max.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 mt-4">Data unavailable</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

