"use client";

import type { Provider } from "@unified-calendar/domain";

interface ProviderFailure {
  provider: Provider;
  retryHref: string;
}

interface AuthErrorBannerProps {
  failures: ProviderFailure[];
}

export function AuthErrorBanner({ failures }: AuthErrorBannerProps) {
  if (failures.length === 0) return null;
  return (
    <div role="alert">
      {failures.map(({ provider, retryHref }) => (
        <div key={provider}>
          <span>
            Failed to connect to{" "}
            {provider === "google" ? "Google" : "Microsoft"}.
          </span>
          <a href={retryHref}>Retry</a>
        </div>
      ))}
    </div>
  );
}
