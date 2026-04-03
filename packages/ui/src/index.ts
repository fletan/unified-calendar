export const UI_PACKAGE_READY = true;

export function providerBadge(provider: "google" | "microsoft"): string {
  return provider === "google" ? "Google" : "Microsoft";
}
