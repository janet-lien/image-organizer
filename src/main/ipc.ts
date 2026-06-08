import { ipcMain } from "electron";
import type { AnalyzeRequest, AnalyzeResponse, ExportReviewedRequest, ExportReviewedResponse } from "../shared/ipcTypes";
import { exportReviewedFolders } from "./export/exporter";
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
}
