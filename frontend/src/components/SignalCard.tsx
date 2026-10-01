import React, { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Clock, ChevronDown, ChevronUp, ShieldCheck, AlertTriangle, Terminal } from "lucide-react";
import { cardVariants } from "../motion/variants";
import { HeuristicResult } from "../api/client";

interface SignalCardProps {
  heuristic: HeuristicResult;
  currentFare: number;
  medianFare: number;
}

export const SignalCard: React.FC<SignalCardProps> = ({ heuristic, currentFare, medianFare }) => {
  const [showRuleTrace, setShowRuleTrace] = useState(false);

  // Signal color styling
  const signalTheme = {
    "BUY NOW": {
      bg: "bg-emerald-950/40 border-emerald-500/50 shadow-emerald-500/10",
      text: "text-emerald-400",
      badge: "bg-emerald-500 text-slate-950 font-black",
      icon: CheckCircle2,
    },
    "CONSIDER BUYING": {
      bg: "bg-teal-950/40 border-teal-500/50 shadow-teal-500/10",
      text: "text-teal-400",
      badge: "bg-teal-500 text-slate-950 font-black",
      icon: CheckCircle2,
    },
    "NEUTRAL / MONITOR": {
      bg: "bg-blue-950/40 border-blue-500/50 shadow-blue-500/10",
      text: "text-blue-400",
      badge: "bg-blue-500 text-slate-950 font-black",
      icon: Clock,
    },
    "CONSIDER WAITING": {
      bg: "bg-amber-950/40 border-amber-500/50 shadow-amber-500/10",
      text: "text-amber-400",
      badge: "bg-amber-500 text-slate-950 font-black",
      icon: Clock,
    },
    "WAIT / PRICE HIGH": {
      bg: "bg-rose-950/40 border-rose-500/50 shadow-rose-500/10",
      text: "text-rose-400",
      badge: "bg-rose-500 text-white font-black",
      icon: AlertCircle,
    },
  }[heuristic.signal];

  const IconComponent = signalTheme.icon;

  return (
    <motion.div
      id="signal-section"
      variants={cardVariants}
      className={`rounded-2xl p-6 border backdrop-blur-xl shadow-xl transition-all ${signalTheme.bg}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-mono text-slate-400 font-semibold">
              Explainable Decision Heuristic
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-blue-400 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              {heuristic.confidence_label}
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            FARE RADAR SIGNAL
          </h2>
        </div>

        {/* Signal Badge */}
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl text-base tracking-wide flex items-center gap-2 shadow-lg ${signalTheme.badge}`}>
            <IconComponent className="w-5 h-5" />
            <span>{heuristic.signal}</span>
          </div>
        </div>
      </div>

      {/* Upward Outlier / Volatility Warnings */}
      <div className="mt-4 space-y-2">
        {heuristic.anomaly_flag && (
          <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Statistical Outlier Detected:</span> Current fare exceeds Q3 + 1.5×IQR boundary. Prices at this level historically soften over subsequent days.
            </div>
          </div>
        )}

        {heuristic.caution_flag && (
          <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Volatility Caution:</span> Fares on this route exhibit very high price swings. Consider monitoring closely.
            </div>
          </div>
        )}
      </div>

      {/* Why? Bullet Breakdown */}
      <div className="mt-4 space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Why did this signal fire?
        </div>
        <ul className="space-y-1.5 text-xs text-slate-300 font-normal">
          {heuristic.reasons.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Rule Trace Expander */}
      <div className="mt-5 pt-3 border-t border-slate-800/80">
        <button
          onClick={() => setShowRuleTrace(!showRuleTrace)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 font-mono transition-colors"
        >
          <Terminal className="w-3.5 h-3.5 text-blue-400" />
          <span>{showRuleTrace ? "Hide Mathematical Rule Trace" : "View Mathematical Rule Trace"}</span>
          {showRuleTrace ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showRuleTrace && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 bg-slate-950/80 rounded-xl p-3 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto"
          >
            <div className="text-slate-500 text-[10px] pb-1 uppercase tracking-wider">
              Deterministic Evaluation Pipeline (No Black-Box)
            </div>
            {heuristic.rule_trace.map((traceLine, i) => (
              <div key={i} className="text-blue-300/90 py-0.5">
                {traceLine}
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Mandatory Disclaimer */}
      <div className="mt-4 text-[10px] text-slate-500 italic">
        {heuristic.disclaimer}
      </div>
    </motion.div>
  );
};

