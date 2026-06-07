import { describe, expect, it } from "vitest";
import { estimateBatchAnalysis } from "../../../src/main/vision/costEstimator";

describe("estimateBatchAnalysis", () => {
  it("flags a batch above the configured budget", () => {
    const result = estimateBatchAnalysis({ imageCount: 800, budgetCny: 3 });

    expect(result.imageCount).toBe(800);
    expect(result.requiresBudgetConfirmation).toBe(true);
  });
});
