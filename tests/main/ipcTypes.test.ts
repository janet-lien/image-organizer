import { describe, expect, it } from "vitest";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  ExportReviewedRequest,
  PreviewFeishuMatchesRequest,
  SelectDirectoryRequest,
  SelectDirectoryResponse,
  UploadFeishuMatchesRequest
} from "../../src/shared/ipcTypes";

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

  it("represents Feishu preview and upload requests", () => {
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
    const previewRequest: PreviewFeishuMatchesRequest = {
      config,
      folderTitles: ["01"]
    };
    const uploadRequest: UploadFeishuMatchesRequest = {
      config,
      items: [
        {
          action: "upload",
          existingTokens: [],
          filePaths: ["/out/01/01_封面.jpg"],
          folderTitle: "01",
          recordId: "rec1"
        }
      ]
    };

    expect(previewRequest.folderTitles).toEqual(["01"]);
    expect(uploadRequest.items[0].action).toBe("upload");
  });

  it("represents directory selection results", () => {
    const request: SelectDirectoryRequest = { title: "选择源文件夹" };
    const response: SelectDirectoryResponse = { path: "/photos" };

    expect(request.title).toBe("选择源文件夹");
    expect(response.path).toBe("/photos");
  });
});
