import { join } from "node:path";
import type { AnalyzeRequest, AnalyzeResponse } from "../../shared/ipcTypes";
import type { ImageAsset, QualityIssue } from "../../shared/types";
import { scanImageDirectory } from "../files/fileScanner";
import { createFolderDrafts } from "../grouping/groupingEngine";
import { inspectThumbnailQuality } from "../media/qualityService";
import { createThumbnail } from "../media/thumbnailService";
import { estimateBatchAnalysis } from "../vision/costEstimator";
import { createDefaultVisionAnalyzer } from "../vision/selectVisionAnalyzer";

interface AnalyzeWorkflowDependencies {
  analyzeBatch: (assets: ImageAsset[]) => Promise<Record<string, ImageAsset["labels"]>>;
  createThumbnail: (sourcePath: string, cacheDir: string) => Promise<string>;
  inspectQuality: (thumbnailPath: string) => Promise<QualityIssue[]>;
  scan: (sourceDir: string) => Promise<ImageAsset[]>;
}

export async function analyzeImageDirectory(
  request: AnalyzeRequest,
  dependencies?: Partial<AnalyzeWorkflowDependencies>
): Promise<AnalyzeResponse> {
  const analyzer = createDefaultVisionAnalyzer();
  const scan = dependencies?.scan ?? scanImageDirectory;
  const createThumbnailForAsset = dependencies?.createThumbnail ?? createThumbnail;
  const inspectQuality = dependencies?.inspectQuality ?? inspectThumbnailQuality;
  const analyzeBatch = dependencies?.analyzeBatch ?? ((assets: ImageAsset[]) => analyzer.analyzeBatch(assets));

  const assets = await scan(request.sourceDir);
  const thumbnailCacheDir = join(request.outputDir || request.sourceDir, ".xhs-thumbnails");
  const preparedAssets: ImageAsset[] = [];

  for (const asset of assets) {
    const thumbnailPath = await createThumbnailForAsset(asset.sourcePath, thumbnailCacheDir);
    const quality = await inspectQuality(thumbnailPath);
    preparedAssets.push({
      ...asset,
      thumbnailPath,
      labels: {
        ...asset.labels,
        quality: mergeQuality(asset.labels.quality, quality)
      }
    });
  }

  const estimate = estimateBatchAnalysis({ imageCount: preparedAssets.length, budgetCny: request.budgetCny });
  const labels = await analyzeBatch(preparedAssets);
  const analyzed = preparedAssets.map((asset) => ({
    ...asset,
    labels: {
      ...(labels[asset.id] ?? asset.labels),
      quality: mergeQuality(asset.labels.quality, labels[asset.id]?.quality ?? [])
    }
  }));
  const folders = createFolderDrafts({
    assets: analyzed,
    strategy: request.strategy,
    targetCount: request.targetCount
  });

  return { assets: analyzed, estimate, folders };
}

function mergeQuality(first: QualityIssue[], second: QualityIssue[]): QualityIssue[] {
  return [...new Set([...first, ...second])];
}
