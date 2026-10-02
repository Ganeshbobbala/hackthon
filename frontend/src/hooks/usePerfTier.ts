import { useEffect } from "react";
import { useAppStore, PerfTier } from "../store/useAppStore";

export function usePerfTier(): PerfTier {
  const perfTier = useAppStore((state) => state.perfTier);
  const setPerfTier = useAppStore((state) => state.setPerfTier);
  const setIs2DMode = useAppStore((state) => state.setIs2DMode);

  useEffect(() => {
    // 1. Check WebGL availability
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      console.warn("WebGL not available. Falling back to 2D Mode.");
      setPerfTier("low");
      setIs2DMode(true);
      return;
    }

    // 2. Measure FPS over sample window to set graphic fidelity tier
    let frameCount = 0;
    let startTime = performance.now();
    let animId: number;

    const measure = (time: number) => {
      // If tab is in background, don't count throttled frames against fidelity
      if (document.hidden) {
        startTime = time;
        frameCount = 0;
        animId = requestAnimationFrame(measure);
        return;
      }

      frameCount++;
      const elapsed = time - startTime;
      if (elapsed >= 1500) {
        const fps = (frameCount / elapsed) * 1000;
        if (fps < 25) {
          setPerfTier("low");
        } else if (fps < 45) {
          setPerfTier("medium");
        } else {
          setPerfTier("high");
        }
        return;
      }
      animId = requestAnimationFrame(measure);
    };

    animId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animId);
  }, [setPerfTier, setIs2DMode]);

  return perfTier;
}
