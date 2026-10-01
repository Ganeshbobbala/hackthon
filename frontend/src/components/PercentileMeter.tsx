import React from "react";
import { motion } from "framer-motion";
import { PercentileResult } from "../api/client";
import { useAppStore } from "../store/useAppStore";

interface PercentileMeterProps {
  percentile: PercentileResult;
  currentFare: number;
}

export const PercentileMeter: React.FC<PercentileMeterProps> = ({ percentile, currentFare }) => {
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const pct = Math.max(0, Math.min(100, percentile.percentile));

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">
            Aviation Percentile Runway
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Weak percentile ranking of ₹{currentFare.toLocaleString()} within historical window
          </p>
        </div>
        <div className="text-right">
          <span className="text-lg font-black text-white font-mono">{pct.toFixed(0)}%</span>
          <div className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold">
            {percentile.band}
          </div>
        </div>
      </div>

      {/* Runway Bar Track */}
      <div className="relative pt-6 pb-2">
        {/* Floating Indicator Needle */}
        <motion.div
          initial={{ left: reducedMotion ? `${pct}%` : "0%" }}
          animate={{ left: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none"
        >
          <div className="bg-white text-slate-900 font-mono text-[10px] font-black px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">
            ₹{currentFare.toLocaleString()}
          </div>
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-white mt-0.5"></div>
        </motion.div>

        {/* 4 Colored Runway Segments */}
        <div className="h-3.5 w-full rounded-full bg-slate-900 p-0.5 flex gap-1 border border-slate-700/80 overflow-hidden">
          {/* 0-25% Low */}
          <div
            className="h-full rounded-l-full bg-emerald-500/80 transition-opacity"
            style={{ width: "25%" }}
            title="0–25%: Relatively Low"
          />
          {/* 25-50% Below Typical */}
          <div
            className="h-full bg-teal-500/80 transition-opacity"
            style={{ width: "25%" }}
            title="25–50%: Below Typical"
          />
          {/* 50-75% Above Typical */}
          <div
            className="h-full bg-amber-500/80 transition-opacity"
            style={{ width: "25%" }}
            title="50–75%: Above Typical"
          />
          {/* 75-100% High */}
          <div
            className="h-full rounded-r-full bg-rose-500/80 transition-opacity"
            style={{ width: "25%" }}
            title="75–100%: High"
          />
        </div>

        {/* Labels below runway */}
        <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-2">
          <span className="text-emerald-400 font-semibold">0% (Low)</span>
          <span className="text-teal-400">25%</span>
          <span className="text-slate-300 font-semibold">50% (Median)</span>
          <span className="text-amber-400">75%</span>
          <span className="text-rose-400 font-semibold">100% (High)</span>
        </div>
      </div>

      {/* Plain Language Sentence */}
      <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-xs text-slate-300">
        <span className="font-semibold text-white">Summary: </span>
        {percentile.sentence}
      </div>
    </div>
  );
};
