/**
 * UTILS.TEST.TS
 * ---------------
 * `utils.ts` has two small helper functions used all over the app. They're
 * short, but they're also the kind of code that's easy to get subtly
 * wrong (off-by-one errors around "is 60 minutes '1h ago' or '60m ago'?"),
 * and since dozens of components rely on them, a mistake here would show
 * up as a confusing, hard-to-trace bug everywhere at once. That combination
 * — small, shared, and easy to get subtly wrong — is exactly the kind of
 * code that benefits most from a quick, permanent test.
 */
import { describe, expect, it } from "vitest";
import { cn, formatRelativeTime } from "./utils";

describe("cn (merges Tailwind CSS class names safely)", () => {
  it("combines multiple class strings into one", () => {
    expect(cn("text-sm", "font-bold")).toBe("text-sm font-bold");
  });

  it("lets a later, more specific class override an earlier conflicting one", () => {
    // Both classes set text color — the point of `cn` is that the second
    // one should win, the same way it would if written by hand in plain
    // CSS, instead of both being applied and the browser picking one
    // unpredictably based on stylesheet order.
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("drops falsy values, which makes conditional classes easy to write", () => {
    const isActive = false;
    expect(cn("base", isActive && "active")).toBe("base");
  });
});

describe("formatRelativeTime (turns a timestamp into '2h ago' style text)", () => {
  it("says 'just now' for anything under a minute old", () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe("just now");
  });

  it("counts in minutes once at least a minute has passed", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000);
    expect(formatRelativeTime(fiveMinutesAgo)).toBe("5m ago");
  });

  it("switches over to hours once 60 minutes have passed", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60_000);
    expect(formatRelativeTime(twoHoursAgo)).toBe("2h ago");
  });

  it("switches over to days once 24 hours have passed", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60_000);
    expect(formatRelativeTime(threeDaysAgo)).toBe("3d ago");
  });
});
