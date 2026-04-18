"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const POLL_INTERVAL_MS = 4 * 60 * 1000;

export function TokenRefreshPoller() {
  const router = useRouter();

  useEffect(() => {
    const poll = async () => {
      const res = await fetch("/api/auth/refresh");
      if (res.status === 401) {
        router.push("/");
      }
    };

    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
