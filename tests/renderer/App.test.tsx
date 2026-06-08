import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  App,
  buildAnalyzeRequest,
  buildExportRequest,
  buildFeishuPreviewRequest,
  buildFeishuUploadRequest,
  setFolderCover
} from "../../src/renderer/App";
import type { AnalyzeResponse, ExportReviewedResponse, PreviewFeishuMatchesResponse } from "../../src/shared/ipcTypes";
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

  it("renders Feishu upload after export completes", () => {
    const html = renderToStaticMarkup(<App initialExportResult={exportResult()} initialResult={analysisResult()} />);

    expect(html).toContain("飞书上传");
    expect(html).toContain("预览匹配");
    expect(html).toContain("开始上传");
  });

  it("builds Feishu preview and upload requests", () => {
    const config = {
      tenantAccessToken: "tenant-token",
      appToken: "app-token",
      tableId: "tbl",
      viewId: "view",
      imageFieldName: "图片",
      titleFieldName: "标题",
      bodyFieldName: "正文",
      uploadParentType: "bitable_image" as const
    };
    const preview = buildFeishuPreviewRequest({
      config,
      folders: analysisResult().folders
    });
    const matches: PreviewFeishuMatchesResponse = {
      matches: [
        {
          action: "upload",
          existingImageTokens: [],
          folderTitle: "01",
          imageCount: 0,
          recordId: "rec1",
          title: "第一篇"
        }
      ],
      skippedFolderCount: 0,
      skippedRecordCount: 0
    };

    expect(preview.folderTitles).toEqual(["01"]);
    expect(
      buildFeishuUploadRequest({
        actionOverrides: {},
        config,
        copiedFiles: exportResult().copiedFiles,
        preview: matches
      }).items[0]
    ).toEqual({
      action: "upload",
      existingTokens: [],
      filePaths: ["/out/01/01_封面.jpg"],
      folderTitle: "01",
      recordId: "rec1"
    });
  });
});

function analysisResult(): AnalyzeResponse {
  return {
    assets: [asset("a")],
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
}

function exportResult(): ExportReviewedResponse {
  return {
    copiedFiles: [{ sourcePath: "/photos/a.jpg", destinationPath: "/out/01/01_封面.jpg" }]
  };
}

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
