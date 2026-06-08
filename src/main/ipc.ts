import { dialog, ipcMain } from "electron";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  ExportReviewedRequest,
  ExportReviewedResponse,
  PreviewFeishuMatchesRequest,
  PreviewFeishuMatchesResponse,
  SelectDirectoryRequest,
  SelectDirectoryResponse,
  UploadFeishuMatchesRequest,
  UploadFeishuMatchesResponse
} from "../shared/ipcTypes";
import { exportReviewedFolders } from "./export/exporter";
import { FeishuClient } from "./feishu/feishuClient";
import { mapFoldersToRecords } from "./feishu/feishuMapper";
import { analyzeImageDirectory } from "./workflow/analyzeWorkflow";

export function registerIpcHandlers(): void {
  ipcMain.handle("selectDirectory", async (_event, request: SelectDirectoryRequest): Promise<SelectDirectoryResponse> => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
      title: request.title
    });

    return { path: result.canceled ? undefined : result.filePaths[0] };
  });

  ipcMain.handle("analyze", async (_event, request: AnalyzeRequest): Promise<AnalyzeResponse> => {
    return analyzeImageDirectory(request);
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
