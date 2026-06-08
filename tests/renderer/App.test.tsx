import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { App, buildAnalyzeRequest, buildExportRequest, setFolderCover } from "../../src/renderer/App";
import type { AnalyzeResponse } from "../../src/shared/ipcTypes";
import type { ImageAsset } from "../../src/shared/types";

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
      assets: [asset("a"), asset("b")],
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
    expect(html).toContain("选择封面");
    expect(html).toContain("复制输出");
  });

  it("marks a folder cover by asset id", () => {
    const [folder] = setFolderCover(
      [
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
      ],
      "folder-01",
      "b"
    );

    expect(folder.coverAssetId).toBe("b");
  });

  it("builds an export request from reviewed folders", () => {
    const assets = [asset("a")];
    const folders = [
      {
        id: "folder-01",
        index: 1,
        title: "01",
        strategy: "by_scene" as const,
        targetCount: { min: 1, max: 8 },
        assetIds: ["a"],
        backupAssetIds: [],
        lowQualityAssetIds: [],
        reusedAssetIds: [],
        coverAssetId: "a"
      }
    ];

    expect(buildExportRequest({ assets, folders, outputDir: "/out" })).toEqual({
      assets,
      folders,
      outputDir: "/out"
    });
  });
});

function asset(id: string): ImageAsset {
  return {
    id,
    sourcePath: `/photos/${id}.jpg`,
    originalName: `${id}.jpg`,
    extension: ".jpg",
    createdAtMs: 1,
    hash: id,
    labels: { roles: ["main_subject"], quality: [] }
  };
}
