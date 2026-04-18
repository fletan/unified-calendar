import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TokenRefreshPoller } from "./TokenRefreshPoller";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("TokenRefreshPoller", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockPush.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders nothing", () => {
    const { container } = render(<TokenRefreshPoller />);
    expect(container.firstChild).toBeNull();
  });

  it("calls /api/auth/refresh after 4 minutes", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ refreshed: [] }), { status: 200 }),
      );

    render(<TokenRefreshPoller />);
    await vi.advanceTimersByTimeAsync(4 * 60 * 1000);

    expect(fetchSpy).toHaveBeenCalledWith("/api/auth/refresh");
  });

  it("redirects to / on 401 response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ reason: "refresh_failed" }), {
        status: 401,
      }),
    );

    render(<TokenRefreshPoller />);
    await vi.advanceTimersByTimeAsync(4 * 60 * 1000);

    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("does not redirect on 200 response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ refreshed: ["google"] }), { status: 200 }),
    );

    render(<TokenRefreshPoller />);
    await vi.advanceTimersByTimeAsync(4 * 60 * 1000);

    expect(mockPush).not.toHaveBeenCalled();
  });
});
