"use client";

import { useEffect } from "react";

function grainOpacity(hour: number): number {
  if (hour >= 22 || hour < 4)  return 0.065; // 2am energy — heavy static
  if (hour >= 4  && hour < 8)  return 0.048;
  if (hour >= 8  && hour < 18) return 0.028; // day
  return 0.040;                               // evening
}

export function TimeOfDayGrain() {
  useEffect(() => {
    const apply = () => {
      const opacity = grainOpacity(new Date().getHours());
      document.documentElement.style.setProperty("--grain-opacity", String(opacity));
    };
    apply();
    const id = setInterval(apply, 60_000);
    return () => clearInterval(id);
  }, []);

  return null;
}
