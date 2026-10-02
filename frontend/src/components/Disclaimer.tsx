import React from "react";
import { ShieldAlert, Compass, Sparkles } from "lucide-react";

export const Disclaimer: React.FC = () => {
  return (
    <footer className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 text-xs text-slate-400">
      <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
        <ShieldAlert className="w-4 h-4 text-blue-400" />
        <span>Aviation Intelligence Principles & Methodological Disclosure</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-400 leading-relaxed">
        <div className="space-y-2">
          <p className="font-medium text-slate-200">
            "An explainable airfare intelligence dashboard that turns historical fare data into understandable price context."
          </p>
          <p>
            "Instead of simply showing today's ticket price, FareRadar explains where that price stands compared with the route's historical behavior."
          </p>
          <p className="text-[11px] text-slate-400">
            Core question answered: <strong className="text-white">"Is today's fare cheap, normal, or high compared with this route's own history?"</strong>
          </p>
        </div>

        <div className="space-y-2">
          <p>
            <strong className="text-slate-300">Synthetic Demonstration Data Disclosure:</strong> The default historical dataset is generated through a seeded, realistic domestic Indian flight pricing simulation modeling seasonal patterns, weekend uplifts, carrier tier offsets, and demand surges (PS-025 Data Science & Predictive Analytics).
          </p>
          <p className="text-[11px] text-slate-400">
            FareRadar generates historical signals, statistical trends, and indicative forecasts with quantified uncertainty. It is not an airline booking platform or financial price guarantee.
          </p>
        </div>
      </div>

      {/* Explicit PS-025 Anti-Goals Compliance */}
      <div className="bg-slate-900/60 border border-amber-500/20 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          PS-025 Anti-Goals Compliance & Scope Boundaries
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
            <span className="text-rose-400 font-semibold block">🚫 No Online Travel Agency / Payments</span>
            <span className="text-slate-400">Pure analytical decision intelligence. Zero checkout flows, ticketing APIs, or credit card handling.</span>
          </div>
          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
            <span className="text-rose-400 font-semibold block">🚫 No Aggressive Scraping</span>
            <span className="text-slate-400">Fully ToS-compliant preloaded historical dataset across 9 domestic metro corridors (no IP bans or bot traps).</span>
          </div>
          <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
            <span className="text-rose-400 font-semibold block">🚫 No Multi-City International</span>
            <span className="text-slate-400">Focused exclusively on domestic point-to-point routes for honest 24-hr statistical validity and depth.</span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800/80 pt-3 text-center text-slate-300 font-medium italic">
        "FareRadar doesn't try to guess the airline's algorithm. It gives travelers historical evidence to understand today's price."
      </div>
    </footer>
  );
};

