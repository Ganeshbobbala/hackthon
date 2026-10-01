import React from "react";
import { motion } from "framer-motion";
import { IndianRupee, TrendingUp, TrendingDown, Percent, Activity, Scale, HelpCircle } from "lucide-react";
import { cardVariants } from "../motion/variants";
import { useCountUp } from "../hooks/useCountUp";
import { WindowStatistics, PercentileResult, VolatilityResult } from "../api/client";

interface KpiCardsSectionProps {
  currentFare: number;
  stats: WindowStatistics;
  percentile: PercentileResult;
  volatility: VolatilityResult;
}

export const KpiCardsSection: React.FC<KpiCardsSectionProps> = ({
  currentFare,
  stats,
  percentile,
  volatility,
}) => {
  const currentFareStr = useCountUp(currentFare);
  const medianFareStr = useCountUp(stats.median);

  const diffFromMedian = stats.median > 0 ? ((currentFare - stats.median) / stats.median) * 100 : 0;
  const isCheaper = diffFromMedian < 0;

  // Signal band colors
  const bandBadgeColor =
    percentile.percentile <= 25
      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
      : percentile.percentile <= 40
      ? "bg-teal-500/15 border-teal-500/30 text-teal-400"
      : percentile.percentile <= 60
      ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
      : percentile.percentile <= 75
      ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
      : "bg-rose-500/15 border-rose-500/30 text-rose-400";

  const volBadgeColor =
    volatility.category === "Low"
      ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
      : volatility.category === "Moderate"
      ? "bg-teal-500/15 border-teal-500/30 text-teal-400"
      : volatility.category === "High"
      ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
      : "bg-rose-500/15 border-rose-500/30 text-rose-400";

  return (
    <div id="kpis-section" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* 1. Current Quoted Fare */}
      <motion.div variants={cardVariants} className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-blue-400" /> Today's Quoted Fare
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-2 tabular-nums">
            {currentFareStr}
          </div>
        </div>
        <div className="text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <span>Active ticket price being evaluated.</span>
        </div>
      </motion.div>

      {/* 2. Typical Fare (Window Median) */}
      <motion.div variants={cardVariants} className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-blue-400" /> Typical (Median) Fare
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                isCheaper
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-rose-500/15 text-rose-400"
              }`}
            >
              {isCheaper ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              {Math.abs(diffFromMedian).toFixed(1)}% {isCheaper ? "below" : "above"}
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-2 tabular-nums">
            {medianFareStr}
          </div>
        </div>
        <div className="text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <span>Median of past {stats.window_days} days; resilient to outliers.</span>
        </div>
      </motion.div>

      {/* 3. Percentile Rank */}
      <motion.div variants={cardVariants} className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-blue-400" /> Percentile Rank
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${bandBadgeColor}`}>
              {percentile.band}
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-2 tabular-nums">
            {percentile.percentile.toFixed(0)}
            <span className="text-xs text-slate-400 font-normal">th percentile</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <span>Cheaper than {100 - Math.round(percentile.percentile)}% of observations.</span>
        </div>
      </motion.div>

      {/* 4. Volatility Index */}
      <motion.div variants={cardVariants} className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" /> Volatility Index
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${volBadgeColor}`}>
              {volatility.category}
            </span>
          </div>
          <div className="text-2xl font-black text-white mt-2 tabular-nums">
            {volatility.volatility_index.toFixed(1)}%
          </div>
        </div>
        <div className="text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <span>Coefficient of variation (std / mean × 100).</span>
        </div>
      </motion.div>

      {/* 5. Historical Range */}
      <motion.div variants={cardVariants} className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Historical Corridor</span>
            <span className="text-[10px] font-mono text-slate-400">n={stats.n}</span>
          </div>
          <div className="text-lg font-bold text-white mt-2 tabular-nums">
            ₹{stats.min.toLocaleString()} – ₹{stats.max.toLocaleString()}
          </div>
        </div>
        <div className="text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <span>IQR (Q1–Q3):</span>
          <span className="font-mono text-slate-300">₹{stats.q1.toLocaleString()} – ₹{stats.q3.toLocaleString()}</span>
        </div>
      </motion.div>
    </div>
  );
};

