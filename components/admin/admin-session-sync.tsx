"use client";

import { useEffect } from "react";
import { AUTH_STATUS_CHANGED_EVENT } from "@/lib/auth/client-events";

export function AdminSessionSync({ active }: { active: boolean }) {
  useEffect(() => {
    window.dispatchEvent(new Event(AUTH_STATUS_CHANGED_EVENT));
  }, [active]);

  return null;
}
