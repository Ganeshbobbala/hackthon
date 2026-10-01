import React, { useState } from "react";
import { Activity, Wind, Info, ChevronDown, ChevronUp, Compass } from "lucide-react";
import { VolatilityResult, TrendResult } from "../api/client";

interface VolatilityPanelProps {
  volatility: VolatilityResult;
  direction: TrendResult;
}

export const VolatilityPanel: React.FC<VolatilityPanelProps> = ({ volatility, direction }) => {
  const [showFormula, setShowFormula] = useState(false);

  // Turbulence wave amplitude proportional to volatility index (clamped 1 to 5)
  const amplitude = Math.max(1, Math.min(5, volatility.volatility_index / 4.0));

  return (
    <div id="volatility-section" className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Route Volatility & Turbulence Index
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Classification:</span>
          <span className="text-xs font-bold text-white px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/30">
            {volatility.category} ({volatility.volatility_index.toFixed(1)}%)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Turbulence Visualizer */}
        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5 font-semibold">
              <Wind className="w-3.5 h-3.5 text-blue-400" /> Price Wave Amplitude
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Turbulence Level: {amplitude.toFixed(1)} / 5.0
            </span>
          </div>

          {/* SVG Animated Wave */}
          <div className="h-12 w-full flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 400 40" className="w-full h-full">
              <path
                d={`M 0 20 Q 50 ${20 - amplitude * 3.5} 100 20 T 200 20 T 300 20 T 400 20`}
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {volatility.explanation}
          </p>
        </div>

        {/* Right: Recent Momentum & Direction */}
        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5 font-semibold">
              <Compass className="w-3.5 h-3.5 text-emerald-400" /> Recent 7-Day Direction
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                direction.direction === "Increasing"
                  ? "bg-rose-500/20 text-rose-300"
                  : direction.direction === "Decreasing"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-blue-500/20 text-blue-300"
              }`}
            >
              {direction.direction} ({direction.change_pct > 0 ? "+" : ""}
              {direction.change_pct.toFixed(1)}%)
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300 font-mono pt-1">
            <span>Last 7D Median: ₹{direction.recent_median.toLocaleString()}</span>
            <span>Prior 7D Median: ₹{direction.previous_median.toLocaleString()}</span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
            {direction.description}
          </p>
        </div>
      </div>

      {/* Formula Expander */}
      <div className="border-t border-slate-800 pt-2">
        <button
          onClick={() => setShowFormula(!showFormula)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 font-mono transition-colors"
        >
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span>{showFormula ? "Hide Mathematical Definition" : "View Mathematical Definition"}</span>
          {showFormula ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showFormula && (
          <div className="mt-2.5 bg-slate-950/90 rounded-xl p-3 border border-slate-800 text-xs text-slate-300 font-mono space-y-1.5">
            <div className="text-blue-300 font-bold">
              Formula: Volatility Index = (std / mean) × 100
            </div>
            <div className="text-[11px] text-slate-400">
              Also known as the Coefficient of Variation (CV). It measures standard deviation scaled by the average fare, enabling fair comparisons across routes with differing baseline prices.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

