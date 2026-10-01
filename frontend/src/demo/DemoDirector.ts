/**
 * DemoDirector: Master Timeline Controller for Hackathon Presentations.
 * Drives a scripted 30-second presentation highlighting each core analytical principle.
 */

import { useAppStore } from "../store/useAppStore";

export interface DemoStepInfo {
  timeSeconds: number;
  title: string;
  talkingPoint: string;
  sectionId?: string;
}

export const DEMO_SCRIPT: DemoStepInfo[] = [
  {
    timeSeconds: 0,
    title: "Cinematic Intro & Mission",
    talkingPoint:
      "FareRadar transforms raw ticket prices into clear, explainable statistical context.",
    sectionId: "stage-3d",
  },
  {
    timeSeconds: 3,
    title: "Flight Departure & Route Trajectory",
    talkingPoint:
      "Tracking flight DEL to BLR along its great-circle path with physics-grounded climb and banking.",
    sectionId: "stage-3d",
  },
  {
    timeSeconds: 6,
    title: "Statistical KPI Context",
    talkingPoint:
      "Evaluating today's fare (₹4,850) against the 60-day median and interquartile dispersion.",
    sectionId: "kpis-section",
  },
  {
    timeSeconds: 9,
    title: "Historical Fare Line & Quartile Corridors",
    talkingPoint:
      "Notice how the fare sits within the Q1–Q3 corridor without relying on black-box opacity.",
    sectionId: "chart-history-section",
  },
  {
    timeSeconds: 12,
    title: "Aviation Percentile Meter",
    talkingPoint:
      "Weak percentile ranking places today's ticket in plain language relative to 60 days of history.",
    sectionId: "distribution-section",
  },
  {
    timeSeconds: 15,
    title: "Route Volatility & Turbulence",
    talkingPoint:
      "Volatility Index measures route price dispersion to assess fare predictability.",
    sectionId: "volatility-section",
  },
  {
    timeSeconds: 18,
    title: "Indicative 7-Day Forecast",
    talkingPoint:
      "Seasonal trend model projects upcoming days with an honest 80% uncertainty envelope.",
    sectionId: "forecast-section",
  },
  {
    timeSeconds: 22,
    title: "Explainable Buy/Wait Signal & Holding Pattern",
    talkingPoint:
      "Every signal produces a transparent rule trace and rationale; plane illustrates the flight state.",
    sectionId: "signal-section",
  },
  {
    timeSeconds: 26,
    title: "Rolling-Origin Validation (Zero Leakage)",
    talkingPoint:
      "Walk-forward backtesting rigorously verified against a naive baseline without data leakage.",
    sectionId: "validation-section",
  },
  {
    timeSeconds: 30,
    title: "Interactive Free Exploration",
    talkingPoint:
      "Demo tour complete! Feel free to switch routes, test custom fares, or upload CSV data.",
    sectionId: "stage-3d",
  },
];

class DemoDirectorController {
  private timer: number | null = null;
  private currentStepIndex: number = 0;
  private isRunning: boolean = false;

  public start() {
    const store = useAppStore.getState();
    store.setDemoMode(true);
    store.setDemoStep(0);
    store.setIntroCompleted(true);
    store.setSelectedRoute("DEL-BLR");
    store.setCurrentFare(4850);
    store.setSelectedWindow(60);
    store.setFlightProgress(0.0);
    store.setFlightPhase("takeoff");

    this.isRunning = true;
    this.currentStepIndex = 0;
    this.runNextStep();
  }

  public stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    useAppStore.getState().setDemoMode(false);
  }

  public toggle() {
    if (this.isRunning) {
      this.stop();
    } else {
      this.start();
    }
  }

  private runNextStep() {
    if (!this.isRunning) return;

    if (this.currentStepIndex >= DEMO_SCRIPT.length) {
      this.stop();
      return;
    }

    const currentStep = DEMO_SCRIPT[this.currentStepIndex];
    const store = useAppStore.getState();
    store.setDemoStep(this.currentStepIndex);

    // Update flight dynamics according to presentation narrative
    if (this.currentStepIndex === 1) {
      store.setFlightPhase("climb");
      store.setFlightProgress(0.15);
    } else if (this.currentStepIndex >= 2 && this.currentStepIndex < 7) {
      store.setFlightPhase("cruise");
      store.setFlightProgress(0.2 + this.currentStepIndex * 0.08);
    } else if (this.currentStepIndex === 7) {
      store.setFlightPhase("holding");
      store.setFlightProgress(0.85);
    }

    // Smooth scroll to relevant section
    if (currentStep.sectionId) {
      const el = document.getElementById(currentStep.sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    const nextIndex = this.currentStepIndex + 1;
    let delay = 3500;
    if (nextIndex < DEMO_SCRIPT.length) {
      const nextStep = DEMO_SCRIPT[nextIndex];
      delay = (nextStep.timeSeconds - currentStep.timeSeconds) * 1000;
    }

    this.currentStepIndex = nextIndex;
    this.timer = window.setTimeout(() => this.runNextStep(), delay);
  }
}

export const demoDirector = new DemoDirectorController();

