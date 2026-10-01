import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "./useAppStore";

describe("useAppStore", () => {
  beforeEach(() => {
    useAppStore.setState({
      selectedRoute: "DEL-BLR",
      selectedAirline: "all",
      selectedWindow: 60,
      currentFare: 4850,
      flightPhase: "cruise",
      flightProgress: 0.5,
      demoMode: false,
      reducedMotion: false,
      is2DMode: false,
    });
  });

  it("should update selected route and reset flight properly", () => {
    const store = useAppStore.getState();
    store.setSelectedRoute("BOM-DEL");
    expect(useAppStore.getState().selectedRoute).toBe("BOM-DEL");

    store.resetFlight();
    expect(useAppStore.getState().flightProgress).toBe(0);
    expect(useAppStore.getState().flightPhase).toBe("takeoff");
  });

  it("should update window and current fare with sanitization", () => {
    const store = useAppStore.getState();
    store.setSelectedWindow(90);
    expect(useAppStore.getState().selectedWindow).toBe(90);

    store.setCurrentFare(7200);
    expect(useAppStore.getState().currentFare).toBe(7200);

    // Minimum fare clamp
    store.setCurrentFare(100);
    expect(useAppStore.getState().currentFare).toBe(500);
  });

  it("should clamp flight progress between 0 and 1", () => {
    const store = useAppStore.getState();
    store.setFlightProgress(1.5);
    expect(useAppStore.getState().flightProgress).toBe(1.0);

    store.setFlightProgress(-0.2);
    expect(useAppStore.getState().flightProgress).toBe(0.0);
  });

  it("should toggle demo mode and 2D mode cleanly", () => {
    const store = useAppStore.getState();
    store.setDemoMode(true);
    expect(useAppStore.getState().demoMode).toBe(true);

    store.setIs2DMode(true);
    expect(useAppStore.getState().is2DMode).toBe(true);
  });
});
