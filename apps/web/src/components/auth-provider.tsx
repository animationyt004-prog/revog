"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-store";

/** Resumes the session (via refresh cookie) once per app load. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const bootstrap = useAuth((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return children;
}
