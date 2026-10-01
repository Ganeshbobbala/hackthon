import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { LineChart as LucideLineChart } from "lucide-react";
import { ChartDataPoint, WindowStatistics } from "../api/client";

interface FareChartProps {
  data: ChartDataPoint[];
  stats: WindowStatistics;
  currentFare: number;
}

export const FareChart: React.FC<FareChartProps> = ({ data, stats, currentFare }) => {
  return (
    <div id="chart-history-section" className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
            <LucideLineChart className="w-4 h-4 text-blue-400" />
            Historical Fare Trajectory & Quartile Band
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Daily fares across the {stats.window_days}-day window with 7-day rolling median & Q1–Q3 corridor
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-blue-400">
            <span className="w-3 h-0.5 bg-blue-400 inline-block"></span>
            <span>Daily Fare</span>
          </div>
          <div className="flex items-center gap-1.5 text-teal-400">
            <span className="w-3 h-0.5 bg-teal-400 inline-block"></span>
            <span>7D Median</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400">
            <span className="w-3 h-0.5 border-t border-dashed border-amber-400 inline-block"></span>
            <span>Today (₹{currentFare.toLocaleString()})</span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="fareFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />

            <XAxis
              dataKey="date"
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              tickFormatter={(str) => {
                const parts = str.split("-");
                return parts.length === 3 ? `${parts[1]}/${parts[2]}` : str;
              }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              domain={["dataMin - 300", "dataMax + 400"]}
              tickFormatter={(v) => `₹${Math.round(v)}`}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as ChartDataPoint;
                  return (
                    <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs space-y-1 font-mono">
                      <div className="text-slate-400 font-sans">{pt.date}</div>
                      <div className="text-blue-400 font-bold">Daily Fare: ₹{pt.fare.toLocaleString()}</div>
                      {pt.rolling_median && (
                        <div className="text-teal-400">7-Day Median: ₹{pt.rolling_median.toLocaleString()}</div>
                      )}
                      <div className="text-slate-500 text-[10px]">
                        Corridor: ₹{stats.q1.toLocaleString()} – ₹{stats.q3.toLocaleString()}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Current Fare Reference Line */}
            <ReferenceLine
              y={currentFare}
              stroke="#F59E0B"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Today: ₹${currentFare.toLocaleString()}`,
                fill: "#F59E0B",
                position: "right",
                fontSize: 10,
              }}
            />

            {/* Q1 & Q3 Threshold Reference Lines */}
            <ReferenceLine y={stats.q1} stroke="#10B981" strokeDasharray="2 2" strokeOpacity={0.4} />
            <ReferenceLine y={stats.q3} stroke="#EF4444" strokeDasharray="2 2" strokeOpacity={0.4} />

            {/* Daily fare line */}
            <Area
              type="monotone"
              dataKey="fare"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#fareFill)"
            />

            {/* 7-day rolling median line */}
            <Line
              type="monotone"
              dataKey="rolling_median"
              stroke="#2DD4BF"
              strokeWidth={1.8}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

