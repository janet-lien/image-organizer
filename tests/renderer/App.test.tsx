import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { App, buildAnalyzeRequest } from "../../src/renderer/App";
import type { AnalyzeResponse } from "../../src/shared/ipcTypes";

describe("App", () => {
  it("renders the import entry point", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain("导入素材");
    expect(html).toContain("开始分析");
    expect(html).toContain('<button class="primary" type="button">开始分析</button>');
  });

  it("builds an analysis request from import form state", () => {
    expect(
      buildAnalyzeRequest({
        sourceDir: "/photos",
        outputDir: "/out",
        strategy: "by_variant",
        targetCountText: "5-8",
        budgetCnyText: "10"
      })
    ).toEqual({
      sourceDir: "/photos",
      outputDir: "/out",
      strategy: "by_variant",
      targetCount: { min: 5, max: 8 },
      budgetCny: 10
    });
  });

  it("renders review after analysis completes", () => {
    const result: AnalyzeResponse = {
      estimate: {
        imageCount: 2,
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
          targetCount: { min: 5, max: 8 },
          assetIds: ["a", "b"],
          backupAssetIds: [],
          lowQualityAssetIds: [],
          reusedAssetIds: []
        }
      ]
    };

    const html = renderToStaticMarkup(<App initialResult={result} />);

    expect(html).toContain("确认分组");
    expect(html).toContain("2 张");
  });
});
