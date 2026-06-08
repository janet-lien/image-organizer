import { ipcMain } from "electron";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  ExportReviewedRequest,
  ExportReviewedResponse,
  PreviewFeishuMatchesRequest,
  PreviewFeishuMatchesResponse,
  UploadFeishuMatchesRequest,
  UploadFeishuMatchesResponse
} from "../shared/ipcTypes";
import { exportReviewedFolders } from "./export/exporter";
import { FeishuClient } from "./feishu/feishuClient";
import { mapFoldersToRecords } from "./feishu/feishuMapper";
import { scanImageDirectory } from "./files/fileScanner";
import { createFolderDrafts } from "./grouping/groupingEngine";
import { estimateBatchAnalysis } from "./vision/costEstimator";
import { MockVisionAnalyzer } from "./vision/mockVisionAnalyzer";

export function registerIpcHandlers(): void {
  ipcMain.handle("analyze", async (_event, request: AnalyzeRequest): Promise<AnalyzeResponse> => {
    const assets = await scanImageDirectory(request.sourceDir);
    const estimate = estimateBatchAnalysis({ imageCount: assets.length, budgetCny: request.budgetCny });
    const analyzer = new MockVisionAnalyzer();
    const labels = await analyzer.analyzeBatch(assets);
    const analyzed = assets.map((asset) => ({ ...asset, labels: labels[asset.id] ?? asset.labels }));
    const folders = createFolderDrafts({
      assets: analyzed,
      strategy: request.strategy,
      targetCount: request.targetCount
    });

    return { assets: analyzed, estimate, folders };
  });

  ipcMain.handle("exportReviewed", async (_event, request: ExportReviewedRequest): Promise<ExportReviewedResponse> => {
    return exportReviewedFolders(request);
  });

  ipcMain.handle(
    "previewFeishuMatches",
    async (_event, request: PreviewFeishuMatchesRequest): Promise<PreviewFeishuMatchesResponse> => {
      const client = new FeishuClient(request.config);
      const records = await client.listRecordSummaries();
      const mapped = mapFoldersToRecords({ folderTitles: request.folderTitles, records });
      const recordMap = new Map(records.map((record) => [record.recordId, record]));

      return {
        ...mapped,
        matches: mapped.matches.map((match) => ({
          ...match,
          existingImageTokens: recordMap.get(match.recordId)?.existingImageTokens ?? []
        }))
      };
    }
  );

  ipcMain.handle(
    "uploadFeishuMatches",
    async (_event, request: UploadFeishuMatchesRequest): Promise<UploadFeishuMatchesResponse> => {
      const client = new FeishuClient(request.config);
      const failedRecords: Array<{ recordId: string; reason: string }> = [];
      let skippedRecordCount = 0;
      let uploadedRecordCount = 0;

      for (const item of request.items) {
        if (item.action === "skip") {
          skippedRecordCount += 1;
          continue;
        }

        try {
          const uploadedTokens: string[] = [];
          for (const filePath of item.filePaths) {
            uploadedTokens.push(await client.uploadImage(filePath));
          }
          await client.updateRecordImages({
            existingTokens: item.existingTokens,
            mode: item.action === "append" ? "append" : "replace",
            recordId: item.recordId,
            uploadedTokens
          });
          uploadedRecordCount += 1;
        } catch (error) {
          failedRecords.push({
            recordId: item.recordId,
            reason: error instanceof Error ? error.message : "Unknown Feishu upload error"
          });
        }
      }

      return { failedRecords, skippedRecordCount, uploadedRecordCount };
    }
  );
}
