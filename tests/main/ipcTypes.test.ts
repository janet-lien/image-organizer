import { describe, expect, it } from "vitest";
import type { AnalyzeRequest } from "../../src/shared/ipcTypes";

describe("IPC contracts", () => {
  it("represents an analysis request", () => {
    const request: AnalyzeRequest = {
      sourceDir: "/photos",
      outputDir: "/out",
      strategy: "by_scene",
      targetCount: { min: 5, max: 8 },
      budgetCny: 10
    };

    expect(request.targetCount.max).toBe(8);
  });
});
