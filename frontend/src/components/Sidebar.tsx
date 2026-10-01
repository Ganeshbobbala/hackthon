import React, { useState } from "react";
import { Sliders, Plane, Building2, Calendar, IndianRupee, FastForward, Activity, Sparkles } from "lucide-react";
import { useAppStore } from "../store/useAppStore";
import { RouteInfo } from "../api/client";
import { demoDirector } from "../demo/DemoDirector";

interface SidebarProps {
  routes: RouteInfo[];
  airlines: string[];
  onAnalyze: () => void;
  isLoading?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ routes, airlines, onAnalyze, isLoading }) => {
  const selectedRoute = useAppStore((state) => state.selectedRoute);
  const setSelectedRoute = useAppStore((state) => state.setSelectedRoute);
  const selectedAirline = useAppStore((state) => state.selectedAirline);
  const setSelectedAirline = useAppStore((state) => state.setSelectedAirline);
  const selectedWindow = useAppStore((state) => state.selectedWindow);
  const setSelectedWindow = useAppStore((state) => state.setSelectedWindow);
  const currentFare = useAppStore((state) => state.currentFare);
  const setCurrentFare = useAppStore((state) => state.setCurrentFare);
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const setReducedMotion = useAppStore((state) => state.setReducedMotion);
  const is2DMode = useAppStore((state) => state.is2DMode);
  const setIs2DMode = useAppStore((state) => state.setIs2DMode);
  const resetFlight = useAppStore((state) => state.resetFlight);

  const [inputFare, setInputFare] = useState<string>(currentFare.toString());

  const currentRouteInfo = routes.find((r) => r.route === selectedRoute);

  const handleRouteChange = (newRoute: string) => {
    setSelectedRoute(newRoute);
    const info = routes.find((r) => r.route === newRoute);
    if (info) {
      setCurrentFare(info.default_fare);
      setInputFare(info.default_fare.toString());
    }
    resetFlight();
  };

  const handleFareBlur = () => {
    const parsed = parseFloat(inputFare);
    if (!isNaN(parsed) && parsed > 0) {
      const clamped = Math.max(500, Math.min(100000, parsed));
      setCurrentFare(clamped);
      setInputFare(clamped.toString());
    } else {
      setInputFare(currentFare.toString());
    }
  };

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 glass-panel rounded-2xl p-5 border border-slate-800 space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">Flight Controls</h2>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded">
          Parameters
        </span>
      </div>

      {/* 1. Route Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Plane className="w-3.5 h-3.5 text-blue-400" /> Domestic Route
        </label>
        <select
          value={selectedRoute}
          onChange={(e) => handleRouteChange(e.target.value)}
          className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
        >
          {routes.map((r) => (
            <option key={r.route} value={r.route}>
              {r.route} — {r.origin.city} to {r.destination.city} ({r.total_records} obs)
            </option>
          ))}
        </select>
        {currentRouteInfo && (
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-0.5">
            <span>Distance: {currentRouteInfo.distance_km} km</span>
            <span>Typical: ₹{currentRouteInfo.default_fare.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* 2. Airline Filter */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-blue-400" /> Airline Carrier
        </label>
        <select
          value={selectedAirline}
          onChange={(e) => setSelectedAirline(e.target.value)}
          className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
        >
          <option value="all">All Airlines (Route Aggregate)</option>
          {airlines.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Analysis Window (30, 60, 90) */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-400" /> Historical Window
        </label>
        <div className="grid grid-cols-3 gap-2">
          {([30, 60, 90] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setSelectedWindow(w)}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                selectedWindow === w
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-400"
                  : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
              }`}
            >
              {w} Days
            </button>
          ))}
        </div>
      </div>

      {/* 4. Current Fare Input & Slider */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-blue-400" /> Today's Quoted Fare
          </label>
          <div className="relative">
            <span className="absolute left-2 top-1.5 text-xs text-slate-400 font-mono">₹</span>
            <input
              type="number"
              value={inputFare}
              onChange={(e) => {
                setInputFare(e.target.value);
                const p = parseFloat(e.target.value);
                if (!isNaN(p) && p > 0) setCurrentFare(p);
              }}
              onBlur={handleFareBlur}
              className="w-28 bg-slate-900 border border-slate-700 rounded-lg pl-5 pr-2 py-1 text-right text-xs font-bold font-mono text-white focus:outline-none focus:border-blue-500"
              placeholder="Fare"
            />
          </div>
        </div>

        <input
          type="range"
          min={1500}
          max={12000}
          step={50}
          value={currentFare}
          onChange={(e) => {
            const v = Number(e.target.value);
            setCurrentFare(v);
            setInputFare(v.toString());
          }}
          className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
        />

        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>₹1,500 (Promo)</span>
          <span>₹6,000 (Median)</span>
          <span>₹12,000 (Peak)</span>
        </div>
      </div>

      {/* 5. Primary Action Button */}
      <button
        onClick={onAnalyze}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        {isLoading ? "Computing Signals..." : "Analyze Fare Context"}
      </button>

      {/* 6. Demo & Accessibility Toggles */}
      <div className="border-t border-slate-800 pt-4 space-y-2.5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Experience Options
        </div>

        <button
          onClick={() => demoDirector.toggle()}
          className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-blue-400 hover:text-blue-300 font-medium py-1.5 px-3 rounded-lg text-xs flex items-center justify-between transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> 30s Guided Tour
          </span>
          <span className="font-mono text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
            Key [D]
          </span>
        </button>

        <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer select-none">
          <span className="flex items-center gap-1.5">
            <FastForward className="w-3.5 h-3.5 text-slate-400" /> Reduced Motion
          </span>
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => setReducedMotion(e.target.checked)}
            className="rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-0 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer select-none">
          <span className="flex items-center gap-1.5">
            <Plane className="w-3.5 h-3.5 text-slate-400" /> 2D Vector Map Mode
          </span>
          <input
            type="checkbox"
            checked={is2DMode}
            onChange={(e) => setIs2DMode(e.target.checked)}
            className="rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-0 cursor-pointer"
          />
        </label>
      </div>
    </aside>
  );
};

