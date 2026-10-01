import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { TrendingUp, AlertCircle, Sparkles } from "lucide-react";
import { ForecastData } from "../api/client";

interface ForecastChartProps {
  forecastData?: ForecastData;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ forecastData }) => {
  if (!forecastData) return null;

  if (!forecastData.available) {
    return (
      <div id="forecast-section" className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>Indicative Forecast Unavailable</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {forecastData.reason || "At least 30 observations are required to generate an indicative forecast."}
        </p>
        <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 text-[11px] text-slate-400">
          Fare Radar enforces strict sample size requirements to avoid fabricating predictive signals on sparse historical records. All other statistical percentile and heuristic panels continue to operate normally.
        </div>
      </div>
    );
  }

  // Merge last 14 historical points with 7 forecast points
  const combinedData: Array<{
    date: string;
    actualFare?: number;
    forecastFare?: number;
    upperBound?: number;
    lowerBound?: number;
    isForecast: boolean;
  }> = [];

  const historyTail = forecastData.history.slice(-14);
  for (const h of historyTail) {
    combinedData.push({
      date: h.date,
      actualFare: h.fare,
      isForecast: false,
    });
  }

  // Connect last actual point to first forecast point
  if (historyTail.length > 0 && forecastData.forecast.length > 0) {
    const lastHist = historyTail[historyTail.length - 1];
    combinedData[combinedData.length - 1].forecastFare = lastHist.fare;
    combinedData[combinedData.length - 1].lowerBound = lastHist.fare;
    combinedData[combinedData.length - 1].upperBound = lastHist.fare;
  }

  for (const f of forecastData.forecast) {
    combinedData.push({
      date: f.date,
      forecastFare: f.yhat,
      lowerBound: f.yhat_lower,
      upperBound: f.yhat_upper,
      isForecast: true,
    });
  }

  const todayDate = historyTail.length > 0 ? historyTail[historyTail.length - 1].date : "";

  return (
    <div id="forecast-section" className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-sky-400" />
            Indicative 7-Day Forward Horizon & Uncertainty Envelope
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Engine: {forecastData.method} • 80% statistical prediction interval
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-blue-400">
            <span className="w-3 h-0.5 bg-blue-400 inline-block"></span>
            <span>Recorded Fare</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-400 inline-block"></span>
            <span>7-Day Indicative</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-3 h-2 bg-emerald-500/20 border border-emerald-500/40 rounded inline-block"></span>
            <span>80% Envelope</span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={combinedData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
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
                  const pt = payload[0].payload;
                  return (
                    <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs space-y-1 font-mono">
                      <div className="text-slate-400 font-sans">
                        {pt.date} {pt.date === todayDate ? "(TODAY / LATEST)" : pt.isForecast ? "(INDICATIVE)" : ""}
                      </div>
                      {pt.actualFare !== undefined && !pt.isForecast && (
                        <div className="text-blue-400 font-bold">Recorded: ₹{pt.actualFare.toLocaleString()}</div>
                      )}
                      {pt.forecastFare !== undefined && (
                        <div className="text-emerald-400 font-bold">
                          Forecast: ₹{Math.round(pt.forecastFare).toLocaleString()}
                        </div>
                      )}
                      {pt.lowerBound !== undefined && pt.upperBound !== undefined && pt.isForecast && (
                        <div className="text-slate-400 text-[10px]">
                          80% Interval: ₹{Math.round(pt.lowerBound).toLocaleString()} – ₹{Math.round(pt.upperBound).toLocaleString()}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* TODAY Divider */}
            {todayDate && (
              <ReferenceLine
                x={todayDate}
                stroke="#38BDF8"
                strokeDasharray="4 4"
                label={{
                  value: "TODAY / REF DATE",
                  fill: "#38BDF8",
                  position: "top",
                  fontSize: 10,
                }}
              />
            )}

            {/* 80% Uncertainty Envelope Area */}
            <Area
              type="monotone"
              dataKey="upperBound"
              stroke="transparent"
              fill="url(#forecastBand)"
            />

            {/* Actual Line */}
            <Line
              type="monotone"
              dataKey="actualFare"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ r: 2 }}
            />

            {/* Forecast Line */}
            <Line
              type="monotone"
              dataKey="forecastFare"
              stroke="#10B981"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: "#10B981" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[11px] text-slate-400 italic">
        {forecastData.disclaimer}
      </div>
    </div>
  );
};

