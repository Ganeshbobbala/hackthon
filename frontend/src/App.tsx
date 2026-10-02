import React, { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, AlertTriangle, RefreshCw, ChevronRight } from "lucide-react";

import { useAppStore } from "./store/useAppStore";
import { useReducedMotion } from "./hooks/useReducedMotion";
import { usePerfTier } from "./hooks/usePerfTier";
import { demoDirector } from "./demo/DemoDirector";

import {
  fetchRoutes,
  fetchAirlines,
  fetchAnalysis,
  fetchForecast,
  fetchValidation,
  fetchFlightPath,
  fetchDataQuality,
} from "./api/client";

import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { GlobeScene } from "./scene/GlobeScene";
import { GlobeErrorBoundary } from "./scene/GlobeErrorBoundary";
import { Scene2DFallback } from "./components/Scene2DFallback";
import { FlightHud } from "./components/FlightHud";
import { KpiCardsSection } from "./components/KpiCard";
import { SignalCard } from "./components/SignalCard";
import { PercentileMeter } from "./components/PercentileMeter";
import { DistributionChart } from "./components/DistributionChart";
import { FareChart } from "./components/FareChart";
import { VolatilityPanel } from "./components/VolatilityPanel";
import { WindowCards } from "./components/WindowCards";
import { ForecastChart } from "./components/ForecastChart";
import { ValidationPanel } from "./components/ValidationPanel";
import { DataQualityPanel } from "./components/DataQualityPanel";
import { CsvUploadModal } from "./components/CsvUploadModal";
import { SpeakerNotesOverlay } from "./components/SpeakerNotesOverlay";
import { Disclaimer } from "./components/Disclaimer";
import { heroTextVariants, containerVariants } from "./motion/variants";

export const App: React.FC = () => {
  // Sync system preferences and performance tiers
  useReducedMotion();
  const perfTier = usePerfTier();

  const selectedRoute = useAppStore((state) => state.selectedRoute);
  const selectedAirline = useAppStore((state) => state.selectedAirline);
  const selectedWindow = useAppStore((state) => state.selectedWindow);
  const currentFare = useAppStore((state) => state.currentFare);
  const is2DMode = useAppStore((state) => state.is2DMode);
  const introCompleted = useAppStore((state) => state.introCompleted);
  const setIntroCompleted = useAppStore((state) => state.setIntroCompleted);
  const setSpeakerNotesOpen = useAppStore((state) => state.setSpeakerNotesOpen);
  const speakerNotesOpen = useAppStore((state) => state.speakerNotesOpen);

  // 1. Fetch available routes & airlines
  const { data: routes = [], isLoading: routesLoading } = useQuery({
    queryKey: ["routes"],
    queryFn: fetchRoutes,
    staleTime: 1000 * 60 * 10,
  });

  const { data: airlines = [] } = useQuery({
    queryKey: ["airlines"],
    queryFn: fetchAirlines,
    staleTime: 1000 * 60 * 10,
  });

  // 2. Fetch analysis for current route, airline, window, fare
  const {
    data: analysisData,
    isLoading: analysisLoading,
    isError: analysisError,
    error: analysisErrObj,
    refetch: refetchAnalysis,
  } = useQuery({
    queryKey: ["analysis", selectedRoute, selectedAirline, selectedWindow, currentFare],
    queryFn: () =>
      fetchAnalysis({
        route: selectedRoute,
        airline: selectedAirline,
        window: selectedWindow,
        fare: currentFare,
      }),
  });

  // 3. Fetch indicative forecast
  const { data: forecastData } = useQuery({
    queryKey: ["forecast", selectedRoute],
    queryFn: () => fetchForecast(selectedRoute),
  });

  // 4. Fetch rolling-origin validation metrics
  const { data: validationData } = useQuery({
    queryKey: ["validation", selectedRoute],
    queryFn: () => fetchValidation(selectedRoute),
  });

  // 5. Fetch 3D flight trajectory waypoints
  const { data: flightData } = useQuery({
    queryKey: ["flight-path", selectedRoute],
    queryFn: () => fetchFlightPath(selectedRoute),
  });

  // 6. Fetch data quality summary
  const { data: qualityData } = useQuery({
    queryKey: ["data-quality"],
    queryFn: fetchDataQuality,
  });

  // Keyboard shortcut listeners (D = Demo, N = Notes, Esc/Space = Skip Intro)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (e.key === "d" || e.key === "D") {
        demoDirector.toggle();
      } else if (e.key === "n" || e.key === "N") {
        setSpeakerNotesOpen(!speakerNotesOpen);
      } else if (e.key === "Escape" || e.key === " ") {
        if (!introCompleted) setIntroCompleted(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [introCompleted, setIntroCompleted, speakerNotesOpen, setSpeakerNotesOpen]);

  const signal = analysisData?.heuristic.signal;

  return (
    <div className="min-h-screen bg-sky-950 text-slate-100 flex flex-col font-sans transition-colors selection:bg-blue-500 selection:text-white">
      {/* 1. Header */}
      <Header referenceDate={qualityData?.end_date} totalRecords={qualityData?.valid_rows} />

      {/* Hero Intro Banner (auto fades or can be skipped) */}
      {!introCompleted && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full bg-gradient-to-r from-blue-950 via-sky-900 to-indigo-950 border-b border-blue-500/30 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl"
          >
            <motion.div variants={heroTextVariants} initial="hidden" animate="visible" className="space-y-1">
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>WELCOME TO FARE RADAR PRO</span>
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
              </h2>
              <p className="text-xs text-blue-200/90 max-w-3xl leading-relaxed">
                "Instead of simply showing today's ticket price, FareRadar explains where that price stands compared with the route's historical behavior."
              </p>
            </motion.div>
            <button
              onClick={() => setIntroCompleted(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-1.5 shadow-md flex-shrink-0"
            >
              <span>Explore Dashboard</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </AnimatePresence>
      )}

      {/* 2. Main Content Body */}
      <main className="max-w-[1720px] w-full mx-auto p-4 sm:p-6 flex-1 flex flex-col lg:flex-row gap-6">
        {/* Sticky Left Sidebar */}
        <Sidebar
          routes={routes}
          airlines={airlines}
          onAnalyze={() => refetchAnalysis()}
          isLoading={analysisLoading}
        />

        {/* Main Column */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 space-y-6 min-w-0"
        >
          {/* Section 1: 3D Flight Experience Stage & HUD */}
          <div
            id="stage-3d"
            className="relative w-full h-[360px] sm:h-[420px] rounded-2xl overflow-hidden border border-slate-800 glass-panel shadow-2xl"
          >
            {is2DMode ? (
              <Scene2DFallback flightData={flightData} signal={signal} />
            ) : (
              <GlobeErrorBoundary
                fallback={<Scene2DFallback flightData={flightData} signal={signal} />}
              >
                <GlobeScene flightData={flightData} signal={signal} />
              </GlobeErrorBoundary>
            )}
            <FlightHud flightData={flightData} signal={signal} />
          </div>

          {/* Error Banner */}
          {analysisError && (
            <div className="bg-rose-500/15 border border-rose-500/30 rounded-2xl p-4 text-xs text-rose-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                <span>
                  {(analysisErrObj as Error)?.message || "Failed to load airfare analysis for this route."}
                </span>
              </div>
              <button
                onClick={() => refetchAnalysis()}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {/* Section 2: KPI Cards */}
          {analysisData && (
            <KpiCardsSection
              currentFare={analysisData.current_fare}
              stats={analysisData.selected_window_stats}
              percentile={analysisData.percentile}
              volatility={analysisData.volatility}
            />
          )}

          {/* Section 3: FARE RADAR SIGNAL Card */}
          {analysisData && (
            <SignalCard
              heuristic={analysisData.heuristic}
              currentFare={analysisData.current_fare}
              medianFare={analysisData.selected_window_stats.median}
            />
          )}

          {/* Section 4: Fare History Chart */}
          {analysisData && (
            <FareChart
              data={analysisData.fare_series}
              stats={analysisData.selected_window_stats}
              currentFare={analysisData.current_fare}
            />
          )}

          {/* Section 5: Percentile Meter & Distribution Histogram */}
          {analysisData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <PercentileMeter
                percentile={analysisData.percentile}
                currentFare={analysisData.current_fare}
              />
              <DistributionChart
                bins={analysisData.distribution}
                currentFare={analysisData.current_fare}
              />
            </div>
          )}

          {/* Section 6: Volatility & Stability Panel */}
          {analysisData && (
            <VolatilityPanel
              volatility={analysisData.volatility}
              direction={analysisData.direction}
            />
          )}

          {/* Section 7: 30 / 60 / 90 Window Comparison Cards */}
          {analysisData && (
            <WindowCards
              stats30={analysisData.stats_30}
              stats60={analysisData.stats_60}
              stats90={analysisData.stats_90}
            />
          )}

          {/* Section 8: Indicative 7-Day Forecast */}
          <ForecastChart forecastData={forecastData} />

          {/* Section 9: Historical Validation & Rolling-Origin Backtesting */}
          <ValidationPanel validationData={validationData} />

          {/* Section 10: Data Quality Panel */}
          <DataQualityPanel quality={qualityData} />

          {/* Section 11: Methodological Disclaimer & Closing Verdict */}
          <Disclaimer />
        </motion.div>
      </main>

      {/* Modals & Overlays */}
      <CsvUploadModal />
      <SpeakerNotesOverlay />
    </div>
  );
};

