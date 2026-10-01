import React from "react";
import { Plane, Compass } from "lucide-react";
import { FlightPathData } from "../api/client";
import { useAppStore } from "../store/useAppStore";

interface Scene2DFallbackProps {
  flightData?: FlightPathData;
  signal?: string;
}

export const Scene2DFallback: React.FC<Scene2DFallbackProps> = ({ flightData, signal }) => {
  const flightProgress = useAppStore((state) => state.flightProgress);
  const flightPhase = useAppStore((state) => state.flightPhase);

  if (!flightData) return null;

  const { origin, destination, distance_km } = flightData;

  // Indian bounds roughly: Lon 68 to 92 (width), Lat 8 to 35 (height)
  const mapLonToX = (lon: number) => ((lon - 68) / (92 - 68)) * 500 + 50;
  const mapLatToY = (lat: number) => 380 - ((lat - 8) / (35 - 8)) * 320;

  const x1 = mapLonToX(origin.lon);
  const y1 = mapLatToY(origin.lat);
  const x2 = mapLonToX(destination.lon);
  const y2 = mapLatToY(destination.lat);

  // Quadratic bezier curve control point
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - 40; // slight arc upward

  // Interpolate current plane position on bezier curve
  const t = flightProgress;
  const curX = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * mx + t * t * x2;
  const curY = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * my + t * t * y2;

  let pathColor = "#4DA3FF";
  if (signal === "BUY NOW") pathColor = "#2DD4A7";
  else if (signal === "WAIT / PRICE HIGH") pathColor = "#F26D6D";
  else if (signal === "CONSIDER WAITING") pathColor = "#F5B84B";

  return (
    <div className="w-full h-full bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between select-none relative overflow-hidden">
      <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-slate-200">2D Tactical Route Trajectory</span>
          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px]">
            {origin.code} → {destination.code} ({distance_km.toLocaleString()} km)
          </span>
        </div>
        <div className="text-slate-400 text-[11px] font-mono capitalize">
          Phase: <span className="text-blue-400 font-bold">{flightPhase}</span>
        </div>
      </div>

      {/* 2D Vector Trajectory Canvas */}
      <div className="relative w-full h-[220px] flex items-center justify-center">
        <svg viewBox="0 0 600 400" className="w-full h-full max-h-[220px]">
          {/* Subtle grid */}
          <defs>
            <pattern id="grid2d" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid2d)" />

          {/* India Boundary Outline Abstract */}
          <path
            d="M 180 60 L 280 40 L 380 90 L 480 130 L 440 220 L 380 280 L 320 370 L 260 300 L 170 240 L 140 160 Z"
            fill="rgba(30, 41, 59, 0.4)"
            stroke="rgba(77, 163, 255, 0.2)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Great Circle Arc Path */}
          <path
            d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
            fill="none"
            stroke={pathColor}
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Origin Airport Beacon */}
          <circle cx={x1} cy={y1} r="6" fill="#3B82F6" className="animate-pulse" />
          <text x={x1 + 10} y={y1 + 4} fill="#93C5FD" fontSize="12" fontWeight="bold">
            {origin.code} ({origin.city})
          </text>

          {/* Destination Airport Beacon */}
          <circle cx={x2} cy={y2} r="6" fill="#10B981" className="animate-pulse" />
          <text x={x2 + 10} y={y2 + 4} fill="#6EE7B7" fontSize="12" fontWeight="bold">
            {destination.code} ({destination.city})
          </text>

          {/* Moving Aircraft Marker */}
          <g transform={`translate(${curX - 10}, ${curY - 10})`}>
            <circle cx="10" cy="10" r="14" fill="rgba(77, 163, 255, 0.25)" className="animate-ping" />
            <Plane className="w-5 h-5 text-white" />
          </g>
        </svg>
      </div>

      {/* Altitude Profile Bar */}
      <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800 text-[11px] flex items-center justify-between font-mono">
        <span className="text-slate-400">Cruise Profile: FL350 (35,000 ft)</span>
        <span className="text-blue-400">Progress: {(flightProgress * 100).toFixed(0)}%</span>
        <span className="text-slate-400">Speed: ~450 kts</span>
      </div>
    </div>
  );
};
