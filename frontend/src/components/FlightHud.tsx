import React from "react";
import { Gauge, Navigation, RotateCcw, Sun, Moon, CloudSun, Eye } from "lucide-react";
import { useAppStore, TimeOfDay } from "../store/useAppStore";
import { FlightPathData } from "../api/client";

interface FlightHudProps {
  flightData?: FlightPathData;
  signal?: string;
}

export const FlightHud: React.FC<FlightHudProps> = ({ flightData, signal }) => {
  const flightProgress = useAppStore((state) => state.flightProgress);
  const flightPhase = useAppStore((state) => state.flightPhase);
  const resetFlight = useAppStore((state) => state.resetFlight);
  const is2DMode = useAppStore((state) => state.is2DMode);
  const setIs2DMode = useAppStore((state) => state.setIs2DMode);
  const timeOfDay = useAppStore((state) => state.timeOfDay);
  const setTimeOfDay = useAppStore((state) => state.setTimeOfDay);

  const waypoints = flightData?.waypoints || [];
  const totalDist = flightData?.distance_km || 1740;

  // Determine current waypoint stats
  let currentAlt = 0;
  let currentBearing = 178;
  if (waypoints.length > 0) {
    const idx = Math.min(waypoints.length - 1, Math.floor(flightProgress * (waypoints.length - 1)));
    currentAlt = waypoints[idx].alt_ft;
    currentBearing = waypoints[idx].bearing_deg;
  }

  // Realistic speed profile
  let speedKts = 450;
  if (flightPhase === "takeoff" || flightPhase === "gate") speedKts = 160;
  else if (flightPhase === "climb") speedKts = 280;
  else if (flightPhase === "descent" || flightPhase === "approach") speedKts = 220;
  else if (flightPhase === "landed") speedKts = 40;
  else if (flightPhase === "holding") speedKts = 230;

  const distRemaining = Math.max(0, Math.round(totalDist * (1.0 - flightProgress)));
  const etaMinutes = speedKts > 0 ? Math.round((distRemaining / (speedKts * 1.852)) * 60) : 0;

  const cycleTimeOfDay = () => {
    const next: TimeOfDay = timeOfDay === "day" ? "dusk" : timeOfDay === "dusk" ? "night" : "day";
    setTimeOfDay(next);
  };

  return (
    <div className="absolute inset-0 pointer-events-none p-3.5 flex flex-col justify-between z-10 select-none">
      {/* Top Bar: Route & Flight Phase Badge */}
      <div className="flex items-center justify-between">
        <div className="bg-sky-950/85 backdrop-blur-md border border-slate-700/60 rounded-lg px-3 py-1.5 flex items-center gap-3 shadow-lg pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            <span className="text-xs font-bold text-white tracking-wider">
              {flightData?.origin.code || "DEL"} → {flightData?.destination.code || "BLR"}
            </span>
          </div>
          <span className="text-slate-500">|</span>
          <div className="text-[11px] font-mono text-slate-300">
            PHASE:{" "}
            <span
              className={`font-bold uppercase ${
                flightPhase === "holding"
                  ? "text-rose-400"
                  : flightPhase === "cruise"
                  ? "text-blue-400"
                  : "text-emerald-400"
              }`}
            >
              {flightPhase}
            </span>
          </div>
        </div>

        {/* View & Lighting Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIs2DMode(!is2DMode)}
            className="bg-sky-950/85 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700/60 text-xs font-medium flex items-center gap-1.5 backdrop-blur-md transition-colors"
            title="Toggle 2D / 3D Experience"
          >
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span>{is2DMode ? "3D Mode" : "2D View"}</span>
          </button>

          <button
            onClick={cycleTimeOfDay}
            className="bg-sky-950/85 hover:bg-slate-800 text-slate-300 hover:text-white p-1.5 rounded-lg border border-slate-700/60 text-xs backdrop-blur-md transition-colors"
            title={`Time of Day: ${timeOfDay}`}
          >
            {timeOfDay === "day" && <Sun className="w-4 h-4 text-amber-400" />}
            {timeOfDay === "dusk" && <CloudSun className="w-4 h-4 text-orange-400" />}
            {timeOfDay === "night" && <Moon className="w-4 h-4 text-blue-300" />}
          </button>

          <button
            onClick={resetFlight}
            className="bg-sky-950/85 hover:bg-slate-800 text-slate-300 hover:text-white p-1.5 rounded-lg border border-slate-700/60 text-xs backdrop-blur-md transition-colors"
            title="Replay Flight Trajectory"
          >
            <RotateCcw className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Bottom Telemetry HUD Bar */}
      <div className="flex items-center justify-between">
        <div className="bg-sky-950/90 backdrop-blur-md border border-slate-700/70 rounded-lg px-3.5 py-2 shadow-xl flex items-center gap-5 text-xs hud-font pointer-events-auto">
          <div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 uppercase">
              <Gauge className="w-3 h-3 text-blue-400" /> ALTITUDE
            </div>
            <div className="text-white font-bold text-sm">
              {Math.round(currentAlt).toLocaleString()}{" "}
              <span className="text-[10px] text-slate-400 font-normal">FT</span>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-slate-800"></div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase">AIRSPEED</div>
            <div className="text-white font-bold text-sm">
              {speedKts} <span className="text-[10px] text-slate-400 font-normal">KTS</span>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-slate-800"></div>

          <div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 uppercase">
              <Navigation className="w-3 h-3 text-emerald-400" /> HEADING
            </div>
            <div className="text-white font-bold text-sm">
              {Math.round(currentBearing)}°
            </div>
          </div>

          <div className="h-6 w-[1px] bg-slate-800"></div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase">REMAINING</div>
            <div className="text-white font-bold text-sm">
              {distRemaining}{" "}
              <span className="text-[10px] text-slate-400 font-normal">KM (~{etaMinutes}m)</span>
            </div>
          </div>
        </div>

        {/* Signal linked flight status indicator */}
        <div className="bg-sky-950/90 backdrop-blur-md border border-slate-700/70 rounded-lg px-3 py-1.5 text-right pointer-events-auto">
          <div className="text-[9px] text-slate-400 tracking-wider uppercase font-mono">
            Trajectory Status
          </div>
          <div className="text-xs font-bold text-blue-400">
            {flightPhase === "holding"
              ? "Holding Pattern (Wait Signal)"
              : flightPhase === "landed"
              ? "Touchdown at Destination"
              : "Active Great-Circle Arc"}
          </div>
        </div>
      </div>
    </div>
  );
};

