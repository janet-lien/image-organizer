import type { BatchEstimate } from "../../shared/types";

export function estimateBatchAnalysis(input: { imageCount: number; budgetCny: number }): BatchEstimate {
  const min = roundCny(input.imageCount * 0.004);
  const max = roundCny(input.imageCount * 0.012);
  return {
    imageCount: input.imageCount,
    estimatedCostCny: { min, max },
    estimatedAnalysisMinutes: {
      min: Math.max(1, Math.ceil(input.imageCount / 35)),
      max: Math.max(2, Math.ceil(input.imageCount / 12))
    },
    requiresBudgetConfirmation: max > input.budgetCny
  };
}

function roundCny(value: number): number {
  return Math.round(value * 100) / 100;
}
