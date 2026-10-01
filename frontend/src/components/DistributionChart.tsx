import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { BarChart3 } from "lucide-react";
import { DistributionBin } from "../api/client";

interface DistributionChartProps {
  bins: DistributionBin[];
  currentFare: number;
}

export const DistributionChart: React.FC<DistributionChartProps> = ({ bins, currentFare }) => {
  return (
    <div id="distribution-section" className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Where Today's Fare Sits in Historical Distribution
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Frequency distribution of historical ticket fares across {bins.length} equal price bins
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded bg-blue-500/40 inline-block"></span> History
          </span>
          <span className="flex items-center gap-1 text-white font-semibold">
            <span className="w-2.5 h-2.5 rounded bg-sky-400 inline-block"></span> Today's Bin
          </span>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bins} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
            <XAxis
              dataKey="label"
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              angle={-25}
              textAnchor="end"
            />
            <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as DistributionBin;
                  return (
                    <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                      <div className="font-bold text-white">{data.label}</div>
                      <div className="text-blue-400">
                        {data.count} observation{data.count !== 1 ? "s" : ""}
                      </div>
                      {data.is_current && (
                        <div className="text-amber-400 text-[10px] font-bold">
                          ★ Today's fare (₹{currentFare.toLocaleString()}) falls in this bin
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {bins.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.is_current ? "#38BDF8" : "#1E3A8A"}
                  stroke={entry.is_current ? "#FFFFFF" : "#3B82F6"}
                  strokeWidth={entry.is_current ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

