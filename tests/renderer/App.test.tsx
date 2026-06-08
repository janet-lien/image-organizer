import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  App,
  applySelectedDirectory,
  buildAnalyzeRequest,
  buildExportRequest,
  buildFeishuPreviewRequest,
  buildFeishuUploadRequest,
  canAnalyzeImportForm,
  markAssetLowQuality,
  moveAssetToAdjacentFolder,
  restoreLowQualityAsset,
  setFolderCover
} from "../../src/renderer/App";
import { FeishuUploadPage } from "../../src/renderer/pages/FeishuUploadPage";
import type { AnalyzeResponse, ExportReviewedResponse, PreviewFeishuMatchesResponse } from "../../src/shared/ipcTypes";
import type { ImageAsset } from "../../src/shared/types";

describe("App", () => {
  it("renders the import entry point", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain("导入素材");
    expect(html).toContain("选择源文件夹");
    expect(html).toContain("选择输出文件夹");
    expect(html).toContain("开始分析");
    expect(html).toContain('<button class="primary" disabled="" type="button">开始分析</button>');
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

  it("normalizes unsafe analysis form numbers", () => {
    expect(
      buildAnalyzeRequest({
        sourceDir: "/photos",
        outputDir: "/out",
        strategy: "by_variant",
        targetCountText: "0-0",
        budgetCnyText: "-5"
      })
    ).toMatchObject({
      targetCount: { min: 1, max: 1 },
      budgetCny: 0
    });
  });

  it("requires source and output folders before analysis", () => {
    expect(
      canAnalyzeImportForm({
        sourceDir: "/photos",
        outputDir: "",
        strategy: "by_variant",
        targetCountText: "5-8",
        budgetCnyText: "10"
      })
    ).toBe(false);
    expect(
      canAnalyzeImportForm({
        sourceDir: "/photos",
        outputDir: "/out",
        strategy: "by_variant",
        targetCountText: "5-8",
        budgetCnyText: "10"
      })
    ).toBe(true);
  });

  it("applies a selected directory to only the requested import field", () => {
    const form = {
      sourceDir: "/old/source",
      outputDir: "/old/output",
      strategy: "by_scene" as const,
      targetCountText: "5-8",
      budgetCnyText: "10"
    };

    expect(applySelectedDirectory(form, "sourceDir", "/new/source")).toEqual({
      ...form,
      sourceDir: "/new/source"
    });
    expect(applySelectedDirectory(form, "outputDir", undefined)).toBe(form);
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
        },
        {
          id: "folder-02",
          index: 2,
          title: "02",
          strategy: "by_scene",
          targetCount: { min: 5, max: 8 },
          assetIds: [],
          backupAssetIds: [],
          lowQualityAssetIds: [],
          reusedAssetIds: []
        }
      ]
    };

    const html = renderToStaticMarkup(<App initialResult={result} />);

    expect(html).toContain("确认分组");
    expect(html).toContain("2 张");
    expect(html).toContain('src="file:///cache/a.jpg"');
    expect(html).toContain("选择封面");
    expect(html).toContain("下一组");
    expect(html).toContain("低质量");
    expect(html).toContain("复制输出");
  });

  it("keeps export disabled when analysis returns no folders", () => {
    const html = renderToStaticMarkup(
      <App
        initialResult={{
          assets: [],
          estimate: {
            imageCount: 0,
            estimatedCostCny: { min: 0, max: 0 },
            estimatedAnalysisMinutes: { min: 0, max: 0 },
            requiresBudgetConfirmation: false
          },
          folders: []
        }}
      />
    );

    expect(html).toContain('<button class="primary" disabled="" type="button">复制输出</button>');
  });

  it("keeps export disabled when every folder only has low-quality assets", () => {
    const html = renderToStaticMarkup(
      <App
        initialResult={{
          assets: [asset("a")],
          estimate: {
            imageCount: 1,
            estimatedCostCny: { min: 0, max: 0 },
            estimatedAnalysisMinutes: { min: 0, max: 0 },
            requiresBudgetConfirmation: false
          },
          folders: [
            {
              id: "folder-01",
              index: 1,
              title: "01",
              strategy: "by_scene",
              targetCount: { min: 1, max: 8 },
              assetIds: [],
              backupAssetIds: [],
              lowQualityAssetIds: ["a"],
              reusedAssetIds: []
            }
          ]
        }}
      />
    );

    expect(html).toContain('<button class="primary" disabled="" type="button">复制输出</button>');
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

  it("moves an asset to an adjacent folder and clears it as source cover", () => {
    const [first, second] = moveAssetToAdjacentFolder(
      [
        folderDraft({ assetIds: ["a", "b"], coverAssetId: "b", id: "folder-01", title: "01" }),
        folderDraft({ assetIds: ["c"], id: "folder-02", title: "02" })
      ],
      "folder-01",
      "b",
      "next"
    );

    expect(first.assetIds).toEqual(["a"]);
    expect(first.coverAssetId).toBeUndefined();
    expect(second.assetIds).toEqual(["c", "b"]);
  });

  it("moves a formal asset to low quality and restores it", () => {
    const [folder] = markAssetLowQuality(
      [folderDraft({ assetIds: ["a", "b"], coverAssetId: "b", id: "folder-01", title: "01" })],
      "folder-01",
      "b"
    );

    expect(folder.assetIds).toEqual(["a"]);
    expect(folder.lowQualityAssetIds).toEqual(["b"]);
    expect(folder.coverAssetId).toBeUndefined();
    expect(restoreLowQualityAsset([folder], "folder-01", "b")[0]).toMatchObject({
      assetIds: ["a", "b"],
      lowQualityAssetIds: []
    });
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

  it("renders Feishu upload failures with reasons", () => {
    const html = renderToStaticMarkup(
      <FeishuUploadPage
        actionOverrides={{}}
        config={feishuConfig()}
        failedRecords={[{ reason: "token expired", recordId: "rec1" }]}
        isPreviewing={false}
        isUploading={false}
        onActionChange={() => undefined}
        onConfigChange={() => undefined}
        onPreview={() => undefined}
        onUpload={() => undefined}
      />
    );

    expect(html).toContain("上传失败");
    expect(html).toContain("rec1");
    expect(html).toContain("token expired");
  });

  it("keeps Feishu preview disabled until required config is filled", () => {
    const missingConfigHtml = renderToStaticMarkup(
      <FeishuUploadPage
        actionOverrides={{}}
        config={{ ...feishuConfig(), tenantAccessToken: "" }}
        isPreviewing={false}
        isUploading={false}
        onActionChange={() => undefined}
        onConfigChange={() => undefined}
        onPreview={() => undefined}
        onUpload={() => undefined}
      />
    );
    const readyConfigHtml = renderToStaticMarkup(
      <FeishuUploadPage
        actionOverrides={{}}
        config={feishuConfig()}
        isPreviewing={false}
        isUploading={false}
        onActionChange={() => undefined}
        onConfigChange={() => undefined}
        onPreview={() => undefined}
        onUpload={() => undefined}
      />
    );

    expect(missingConfigHtml).toContain('<button class="primary" disabled="" type="button">预览匹配</button>');
    expect(readyConfigHtml).toContain('<button class="primary" type="button">预览匹配</button>');
  });

  it("builds Feishu preview and upload requests", () => {
    const config = feishuConfig();
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

function feishuConfig() {
  return {
    tenantAccessToken: "tenant-token",
    appToken: "app-token",
    tableId: "tbl",
    viewId: "view",
    imageFieldName: "图片",
    titleFieldName: "标题",
    bodyFieldName: "正文",
    uploadParentType: "bitable_image" as const
  };
}

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

function folderDraft(input: {
  assetIds: string[];
  coverAssetId?: string;
  id: string;
  lowQualityAssetIds?: string[];
  title: string;
}) {
  return {
    id: input.id,
    index: Number.parseInt(input.title, 10),
    title: input.title,
    strategy: "by_scene" as const,
    targetCount: { min: 1, max: 8 },
    assetIds: input.assetIds,
    backupAssetIds: [],
    lowQualityAssetIds: input.lowQualityAssetIds ?? [],
    reusedAssetIds: [],
    coverAssetId: input.coverAssetId
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
    thumbnailPath: `/cache/${id}.jpg`,
    labels: { roles: ["main_subject"], quality: [] }
  };
}
