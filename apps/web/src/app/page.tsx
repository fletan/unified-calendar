import { AuthErrorBanner } from "@/components/AuthErrorBanner";
import { OnboardingPrompt } from "@/components/OnboardingPrompt";
import { getSessionConnections } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Page() {
  const connections = await getSessionConnections();

  if (connections.length > 0) {
    redirect("/(calendar)");
  }

  const failures = connections
    .filter((c) => (c as { status?: string }).status === "error")
    .map((c) => ({
      provider: c.provider,
      retryHref:
        c.provider === "google" ? "/api/auth/google" : "/api/auth/microsoft",
    }));

  return (
    <main>
      <AuthErrorBanner failures={failures} />
      <OnboardingPrompt />
    </main>
  );
}
