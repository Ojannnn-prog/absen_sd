"use client";

import { useEffect } from "react";
import { pingActive } from "@/app/student/actions";

export default function ActivePing() {
  useEffect(() => {
    // Ping immediately on mount
    pingActive();

    // Then ping every 3 minutes
    const interval = setInterval(() => {
      pingActive();
    }, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
