"use client";

export function OnboardingPrompt() {
  return (
    <div>
      <h2>Connect your calendars</h2>
      <p>Connect at least one calendar provider to get started.</p>
      <div>
        <a href="/api/auth/google">Connect Google</a>
        <a href="/api/auth/microsoft">Connect Microsoft</a>
      </div>
    </div>
  );
}
