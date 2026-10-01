import { useEffect, useState } from "react";
import { useAppStore } from "../store/useAppStore";

export function useCountUp(
  targetValue: number,
  durationMs: number = 1200,
  prefix: string = "₹",
  formatLocale: boolean = true
): string {
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const [displayValue, setDisplayValue] = useState<number>(() => (reducedMotion ? targetValue : 0));

  useEffect(() => {
    if (reducedMotion) {
      setDisplayValue(targetValue);
      return;
    }

    let startVal = displayValue;
    let startTime: number | null = null;
    let animId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Ease-out cubic formula
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (targetValue - startVal) * easeOut);

      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      }
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [targetValue, durationMs, reducedMotion]);

  if (formatLocale) {
    const formatted = new Intl.NumberFormat("en-IN").format(displayValue);
    return `${prefix}${formatted}`;
  }

  return `${prefix}${displayValue}`;
}
