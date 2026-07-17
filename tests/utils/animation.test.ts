import { describe, expect, it } from "vitest";
import { resolveAnimation } from "../../src/utils/animation";

describe("resolveAnimation", () => {
  it.each([
    ["fade", { opacity: 0 }],
    ["slideUp", { opacity: 0, y: 20 }],
    ["slideDown", { opacity: 0, y: -20 }],
    ["slideLeft", { opacity: 0, x: 20 }],
    ["slideRight", { opacity: 0, x: -20 }],
    ["zoom", { opacity: 0, scale: 0.85 }],
  ] as const)("resolves the %s preset", (preset, initial) => {
    expect(resolveAnimation(preset)).toMatchObject({
      initial,
      transition: { duration: 0.3 },
    });
  });

  it("disables animation for the none preset", () => {
    expect(resolveAnimation("none")).toBeNull();
    expect(resolveAnimation({ preset: "none" })).toBeNull();
  });

  it("uses custom states and timing options", () => {
    expect(resolveAnimation({
      initial: { x: 1 },
      animate: { x: 2 },
      exit: { x: 3 },
      duration: 0.8,
      delay: 0.2,
      easing: "easeOut",
      layout: true,
    })).toEqual({
      initial: { x: 1 },
      animate: { x: 2 },
      exit: { x: 3 },
      transition: { duration: 0.8, delay: 0.2, ease: "easeOut" },
      layout: true,
    });
  });

  it("prefers spring configuration over duration and easing", () => {
    expect(resolveAnimation({
      preset: "fade",
      spring: { stiffness: 200, damping: 20 },
      delay: 0.1,
    })).toMatchObject({
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay: 0.1,
      },
    });
  });

  it("uses fallback states for a custom configuration", () => {
    expect(resolveAnimation({})).toEqual({
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.3 },
      layout: undefined,
    });
  });
});
