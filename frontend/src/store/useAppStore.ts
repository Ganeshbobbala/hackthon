import { create } from "zustand";

export type FlightPhase =
  | "gate"
  | "takeoff"
  | "climb"
  | "cruise"
  | "descent"
  | "approach"
  | "landed"
  | "holding";

export type PerfTier = "high" | "medium" | "low";
export type TimeOfDay = "day" | "dusk" | "night";

interface AppState {
  selectedRoute: string;
  selectedAirline: string;
  selectedWindow: 30 | 60 | 90;
  currentFare: number;
  flightPhase: FlightPhase;
  flightProgress: number; // 0.0 to 1.0
  demoMode: boolean;
  demoStep: number;
  reducedMotion: boolean;
  perfTier: PerfTier;
  is2DMode: boolean;
  introCompleted: boolean;
  theme: "dark" | "light";
  timeOfDay: TimeOfDay;
  speakerNotesOpen: boolean;
  csvModalOpen: boolean;

  // Actions
  setSelectedRoute: (route: string) => void;
  setSelectedAirline: (airline: string) => void;
  setSelectedWindow: (window: 30 | 60 | 90) => void;
  setCurrentFare: (fare: number) => void;
  setFlightPhase: (phase: FlightPhase) => void;
  setFlightProgress: (progress: number) => void;
  setDemoMode: (enabled: boolean) => void;
  setDemoStep: (step: number) => void;
  setReducedMotion: (enabled: boolean) => void;
  setPerfTier: (tier: PerfTier) => void;
  setIs2DMode: (is2D: boolean) => void;
  setIntroCompleted: (completed: boolean) => void;
  setTheme: (theme: "dark" | "light") => void;
  setTimeOfDay: (time: TimeOfDay) => void;
  setSpeakerNotesOpen: (open: boolean) => void;
  setCsvModalOpen: (open: boolean) => void;
  resetFlight: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedRoute: "DEL-BLR",
  selectedAirline: "all",
  selectedWindow: 60,
  currentFare: 4850,
  flightPhase: "cruise",
  flightProgress: 0.5,
  demoMode: false,
  demoStep: 0,
  reducedMotion: false,
  perfTier: "high",
  is2DMode: false,
  introCompleted: false,
  theme: "dark",
  timeOfDay: "day",
  speakerNotesOpen: false,
  csvModalOpen: false,

  setSelectedRoute: (route) => set({ selectedRoute: route }),
  setSelectedAirline: (airline) => set({ selectedAirline: airline }),
  setSelectedWindow: (window) => set({ selectedWindow: window }),
  setCurrentFare: (fare) => set({ currentFare: Math.max(500, fare) }),
  setFlightPhase: (phase) => set({ flightPhase: phase }),
  setFlightProgress: (progress) => set({ flightProgress: Math.max(0, Math.min(1, progress)) }),
  setDemoMode: (demoMode) => set({ demoMode }),
  setDemoStep: (demoStep) => set({ demoStep }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setPerfTier: (perfTier) => set({ perfTier }),
  setIs2DMode: (is2DMode) => set({ is2DMode }),
  setIntroCompleted: (introCompleted) => set({ introCompleted }),
  setTheme: (theme) => set({ theme }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  setSpeakerNotesOpen: (speakerNotesOpen) => set({ speakerNotesOpen }),
  setCsvModalOpen: (csvModalOpen) => set({ csvModalOpen }),
  resetFlight: () => set({ flightProgress: 0, flightPhase: "takeoff" }),
}));
