import React, { useState } from "react";
import { X, UploadCloud, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { uploadCsvFile, CsvUploadData } from "../api/client";
import { useAppStore } from "../store/useAppStore";

export const CsvUploadModal: React.FC = () => {
  const csvModalOpen = useAppStore((state) => state.csvModalOpen);
  const setCsvModalOpen = useAppStore((state) => state.setCsvModalOpen);

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<CsvUploadData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!csvModalOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith(".csv")) {
        setErrorMsg("Only CSV files (.csv) are supported.");
        return;
      }
      if (selected.size > 5 * 1024 * 1024) {
        setErrorMsg("File size exceeds 5 MB limit.");
        return;
      }
      setErrorMsg(null);
      setFile(selected);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setErrorMsg(null);
    try {
      const res = await uploadCsvFile(file);
      setResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Upload validation failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Airfare CSV Schema Validator</h3>
          </div>
          <button
            onClick={() => setCsvModalOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Upload an airfare dataset to test against the Fare Radar schema (in-memory validation only, up to 5 MB).
          Required columns: <code className="text-blue-400 font-mono">date, route, origin, destination, airline, fare</code>.
        </p>

        {/* File Dropzone */}
        <label className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-950/60 transition-colors">
          <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          <FileText className="w-8 h-8 text-blue-400 mb-2" />
          <span className="text-xs font-semibold text-slate-200">
            {file ? file.name : "Click to select or drag CSV file"}
          </span>
          <span className="text-[10px] text-slate-400 mt-1">Maximum size 5 MB</span>
        </label>

        {errorMsg && (
          <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Validation Result */}
        {result && (
          <div
            className={`rounded-xl p-4 border text-xs space-y-2 ${
              result.valid
                ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                : "bg-rose-950/40 border-rose-500/50 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {result.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
              <span>{result.message}</span>
            </div>

            {result.summary && (
              <div className="font-mono text-[11px] space-y-1 text-slate-300 pt-1 border-t border-slate-800">
                <div>Valid Records: {result.summary.valid_rows.toLocaleString()}</div>
                <div>Date Range: {result.summary.start_date} to {result.summary.end_date}</div>
                <div>Routes Found: {result.summary.routes_list.join(", ")}</div>
                <div>Airlines: {result.summary.airlines_list.join(", ")}</div>
              </div>
            )}

            {result.errors.length > 0 && (
              <ul className="list-disc pl-4 text-[11px] text-rose-300 pt-1 space-y-0.5 font-mono">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => setCsvModalOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-all shadow-md shadow-blue-500/20"
          >
            {isUploading ? "Validating Schema..." : "Validate CSV"}
          </button>
        </div>
      </div>
    </div>
  );
};
