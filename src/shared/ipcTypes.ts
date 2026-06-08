import type { BatchEstimate, GroupingStrategy, ImageAsset, NoteFolderDraft, TargetCount } from "./types";

export interface AnalyzeRequest {
  sourceDir: string;
  outputDir: string;
  strategy: GroupingStrategy;
  targetCount: TargetCount;
  budgetCny: number;
}

export interface AnalyzeResponse {
  assets: ImageAsset[];
  estimate: BatchEstimate;
  folders: NoteFolderDraft[];
}

export interface ExportReviewedRequest {
  outputDir: string;
  assets: ImageAsset[];
  folders: NoteFolderDraft[];
}

export interface ExportReviewedResponse {
  copiedFiles: Array<{ sourcePath: string; destinationPath: string }>;
}
