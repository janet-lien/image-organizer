import { describe, expect, it } from "vitest";
import { resolvePreloadPath } from "../../src/main/preloadPath";

describe("resolvePreloadPath", () => {
  it("points at the electron-vite ESM preload bundle", () => {
    expect(resolvePreloadPath("/app/out/main")).toBe("/app/out/preload/index.mjs");
  });
});
