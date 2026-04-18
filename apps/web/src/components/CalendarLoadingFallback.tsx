export function CalendarLoadingFallback() {
  return (
    <div
      role="status"
      aria-label="Loading calendar"
      style={{ width: "100%", height: 600, background: "#f0f0f0" }}
    />
  );
}
