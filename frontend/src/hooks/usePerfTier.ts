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

    // 2. Measure FPS over 1 second sample
    let frameCount = 0;
    let startTime = performance.now();
    let animId: number;

    const measure = (time: number) => {
      frameCount++;
      const elapsed = time - startTime;
      if (elapsed >= 1000) {
        const fps = (frameCount / elapsed) * 1000;
        if (fps < 28) {
          setPerfTier("low");
          setIs2DMode(true);
        } else if (fps < 48) {
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
