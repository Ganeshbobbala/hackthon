import React from "react";
import { CheckCircle, AlertCircle, ShieldAlert, Award, FileSpreadsheet } from "lucide-react";
import { ValidationData } from "../api/client";

interface ValidationPanelProps {
  validationData?: ValidationData;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ validationData }) => {
  if (!validationData) return null;

  const { folds, avg_mae, avg_rmse, avg_mape, avg_coverage_pct, baseline_comparison, per_route_table, disclaimer } =
    validationData;

  return (
    <div id="validation-section" className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            Rolling-Origin Backtest & Scientific Validation (Zero Leakage)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Walk-forward cross-validation: trained strictly on data prior to each cutoff, tested on subsequent 7 days
          </p>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> No Future Leakage
        </span>
      </div>

      {/* Summary KPI Cards for Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-mono uppercase">Average MAE</div>
          <div className="text-lg font-bold text-white font-mono mt-1">₹{avg_mae.toFixed(0)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Mean Absolute Error</div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-mono uppercase">Average RMSE</div>
          <div className="text-lg font-bold text-white font-mono mt-1">₹{avg_rmse.toFixed(0)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Root Mean Sq Error</div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-mono uppercase">Average MAPE</div>
          <div className="text-lg font-bold text-white font-mono mt-1">{avg_mape.toFixed(1)}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Mean % Error</div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
          <div className="text-[10px] text-slate-400 font-mono uppercase">80% Interval Coverage</div>
          <div className="text-lg font-bold text-emerald-400 font-mono mt-1">{avg_coverage_pct.toFixed(0)}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Actuals inside band</div>
        </div>
      </div>

      {/* Plain Words Explanation */}
      <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800 text-xs text-slate-300 leading-relaxed">
        <span className="font-bold text-white">Plain Words Explanation: </span>
        Across rolling 7-day test horizons, the model's indicative forecasts deviated by an average of{" "}
        <span className="font-bold text-blue-400 font-mono">₹{avg_mae.toFixed(0)}</span> from the actual recorded ticket prices (MAPE of{" "}
        <span className="font-bold text-blue-400 font-mono">{avg_mape.toFixed(1)}%</span>). Approximately{" "}
        <span className="font-bold text-emerald-400 font-mono">{avg_coverage_pct.toFixed(0)}%</span> of actual fares fell within the calibrated 80% prediction interval.
      </div>

      {/* Naive Baseline Comparison */}
      <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" /> Naive Baseline Benchmark Comparison
          </span>
          <span
            className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
              baseline_comparison.beats_baseline
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}
          >
            {baseline_comparison.beats_baseline ? "Beats Baseline" : "Comparable to Baseline"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono pt-1">
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-sans block text-[10px]">Model MAE:</span>
            <span className="text-white font-bold text-sm">₹{baseline_comparison.model_mae.toFixed(0)}</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-sans block text-[10px]">
              Naive Baseline ({baseline_comparison.baseline_type}):
            </span>
            <span className="text-slate-300 font-bold text-sm">₹{baseline_comparison.baseline_mae.toFixed(0)}</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-sans block text-[10px]">Variance vs Baseline:</span>
            <span className={`font-bold text-sm ${baseline_comparison.improvement_pct > 0 ? "text-emerald-400" : "text-amber-400"}`}>
              {baseline_comparison.improvement_pct > 0 ? "+" : ""}
              {baseline_comparison.improvement_pct.toFixed(1)}% error reduction
            </span>
          </div>
        </div>
      </div>

      {/* Individual Folds Table */}
      {folds.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Walk-Forward Fold Details
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                  <th className="py-2 px-2.5">Fold</th>
                  <th className="py-2 px-2.5">Train Cutoff</th>
                  <th className="py-2 px-2.5">Test Window</th>
                  <th className="py-2 px-2.5 text-right">MAE</th>
                  <th className="py-2 px-2.5 text-right">RMSE</th>
                  <th className="py-2 px-2.5 text-right">MAPE</th>
                  <th className="py-2 px-2.5 text-right">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {folds.map((f) => (
                  <tr key={f.fold} className="hover:bg-slate-900/50">
                    <td className="py-2 px-2.5 font-bold text-blue-400">Fold #{f.fold}</td>
                    <td className="py-2 px-2.5 text-slate-300">≤ {f.train_end}</td>
                    <td className="py-2 px-2.5 text-slate-300">{f.test_start} → {f.test_end}</td>
                    <td className="py-2 px-2.5 text-right text-white">₹{f.mae.toFixed(0)}</td>
                    <td className="py-2 px-2.5 text-right text-slate-300">₹{f.rmse.toFixed(0)}</td>
                    <td className="py-2 px-2.5 text-right text-slate-300">{f.mape.toFixed(1)}%</td>
                    <td className="py-2 px-2.5 text-right text-emerald-400">{f.coverage_pct.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unranked Per-Route Table */}
      {per_route_table.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
            Cross-Route Benchmark Summary (Unranked)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                  <th className="py-2 px-2.5">Route</th>
                  <th className="py-2 px-2.5 text-right">Obs (n)</th>
                  <th className="py-2 px-2.5 text-right">MAE</th>
                  <th className="py-2 px-2.5 text-right">RMSE</th>
                  <th className="py-2 px-2.5 text-right">MAPE</th>
                  <th className="py-2 px-2.5 text-right">Coverage</th>
                  <th className="py-2 px-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {per_route_table.map((r) => (
                  <tr key={r.route} className="hover:bg-slate-900/50">
                    <td className="py-2 px-2.5 font-bold text-white">{r.route}</td>
                    <td className="py-2 px-2.5 text-right text-slate-400">{r.n_observations}</td>
                    <td className="py-2 px-2.5 text-right text-white">
                      {r.mae > 0 ? `₹${r.mae.toFixed(0)}` : "—"}
                    </td>
                    <td className="py-2 px-2.5 text-right text-slate-300">
                      {r.rmse > 0 ? `₹${r.rmse.toFixed(0)}` : "—"}
                    </td>
                    <td className="py-2 px-2.5 text-right text-slate-300">
                      {r.mape > 0 ? `${r.mape.toFixed(1)}%` : "—"}
                    </td>
                    <td className="py-2 px-2.5 text-right text-emerald-400">
                      {r.coverage_pct > 0 ? `${r.coverage_pct.toFixed(0)}%` : "—"}
                    </td>
                    <td className="py-2 px-2.5 text-[11px] text-slate-400">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mandatory Disclaimer */}
      <div className="text-[10px] text-slate-500 italic pt-1">
        {disclaimer}
      </div>
    </div>
  );
};

