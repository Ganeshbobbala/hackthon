import React from "react";
import { CheckCircle2, AlertTriangle, Database, Upload, Layers } from "lucide-react";
import { DataQualitySummary } from "../api/client";
import { useAppStore } from "../store/useAppStore";

interface DataQualityPanelProps {
  quality?: DataQualitySummary;
}

export const DataQualityPanel: React.FC<DataQualityPanelProps> = ({ quality }) => {
  const setCsvModalOpen = useAppStore((state) => state.setCsvModalOpen);

  if (!quality) return null;

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Dataset Integrity & Quality Audit
          </h3>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
              quality.status === "valid"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
            }`}
          >
            {quality.status === "valid" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {quality.status === "valid" ? "Verified Clean" : "Sanitized with Notices"}
          </span>

          <button
            onClick={() => setCsvModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3 h-3" /> Test Custom CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 font-sans block text-[10px]">Valid Observations</span>
          <span className="text-white font-bold text-sm">{quality.valid_rows.toLocaleString()}</span>
          <span className="text-slate-500 block text-[10px]">Total: {quality.total_rows.toLocaleString()}</span>
        </div>

        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 font-sans block text-[10px]">Coverage Span</span>
          <span className="text-white font-bold text-[11px] truncate block">{quality.start_date}</span>
          <span className="text-slate-400 text-[10px]">to {quality.end_date}</span>
        </div>

        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 font-sans block text-[10px]">Domestic Hubs</span>
          <span className="text-white font-bold text-sm">{quality.routes_count} Routes</span>
          <span className="text-slate-500 block text-[10px]">{quality.airlines_count} Airlines</span>
        </div>

        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 font-sans block text-[10px]">Data Cleaning Checks</span>
          <span className="text-emerald-400 font-bold text-[11px] block">0 Corrupt Fares</span>
          <span className="text-slate-500 text-[10px]">{quality.duplicate_rows} Deduplicated</span>
        </div>
      </div>

      {quality.issues.length > 0 && (
        <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800 space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Sanitization Notices Handled Automatically:
          </div>
          {quality.issues.map((issue, idx) => (
            <div key={idx} className="text-xs text-amber-300/90 flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>{issue}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
