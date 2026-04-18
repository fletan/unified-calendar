import type { Provider } from "@unified-calendar/domain";

export const UI_PACKAGE_READY = true;

export interface ProviderBadge {
  label: string;
  color: string;
}

export function providerBadge(provider: Provider): ProviderBadge {
  if (provider === "google") {
    return { label: "Google", color: "#4285F4" };
  }
  return { label: "Microsoft", color: "#00A4EF" };
}
