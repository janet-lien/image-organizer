import { describe, expect, it } from "vitest";
import type { AnalyzeRequest, AnalyzeResponse, ExportReviewedRequest } from "../../src/shared/ipcTypes";

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

  it("represents analysis output and export input", () => {
    const response: AnalyzeResponse = {
      assets: [
        {
          id: "a",
          sourcePath: "/photos/a.jpg",
          originalName: "a.jpg",
          extension: ".jpg",
          createdAtMs: 1,
          hash: "a",
          labels: { roles: ["main_subject"], quality: [] }
        }
      ],
      estimate: {
        imageCount: 1,
        estimatedCostCny: { min: 0.01, max: 0.02 },
        estimatedAnalysisMinutes: { min: 1, max: 2 },
        requiresBudgetConfirmation: false
      },
      folders: [
        {
          id: "folder-01",
          index: 1,
          title: "01",
          strategy: "by_scene",
          targetCount: { min: 1, max: 8 },
          assetIds: ["a"],
          backupAssetIds: [],
          lowQualityAssetIds: [],
          reusedAssetIds: [],
          coverAssetId: "a"
        }
      ]
    };
    const request: ExportReviewedRequest = {
      outputDir: "/out",
      assets: response.assets,
      folders: response.folders
    };

    expect(request.folders[0].coverAssetId).toBe("a");
  });
});
