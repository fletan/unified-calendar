"use client";

import type { Provider } from "@unified-calendar/domain";

interface ProviderMeta {
  provider: Provider;
  stale: boolean;
}

interface ProviderBannerProps {
  providers: ProviderMeta[];
}

export function ProviderBanner({ providers }: ProviderBannerProps) {
  const staleProviders = providers.filter((p) => p.stale);
  if (staleProviders.length === 0) return null;
  return (
    <div role="status">
      {staleProviders.map(({ provider }) => (
        <div key={provider}>
          {provider === "google" ? "Google" : "Microsoft"} calendar data may be
          outdated.
        </div>
      ))}
    </div>
  );
}
