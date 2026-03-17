import { describe, it, expect } from "vitest";
import { timeAgo } from "@/lib/utils";

describe("timeAgo", () => {
  it("returns 'Just now' for current time", () => {
    expect(timeAgo(new Date().toISOString())).toBe("Just now");
  });

  it("returns minutes for recent timestamps", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe("5m ago");
  });

  it("returns hours for older timestamps", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600000).toISOString();
    expect(timeAgo(threeHoursAgo)).toBe("3h ago");
  });

  it("returns days for old timestamps", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
    expect(timeAgo(twoDaysAgo)).toBe("2d ago");
  });

  it("handles edge case at exactly 1 hour", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60000).toISOString();
    expect(timeAgo(oneHourAgo)).toBe("1h ago");
  });
});
