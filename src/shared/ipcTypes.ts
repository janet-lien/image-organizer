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

export interface FeishuUploadConfig {
  tenantAccessToken: string;
  appToken: string;
  tableId: string;
  viewId: string;
  imageFieldName: string;
  titleFieldName: string;
  bodyFieldName: string;
  uploadParentType: "bitable_image" | "bitable_file";
}

export interface PreviewFeishuMatchesRequest {
  config: FeishuUploadConfig;
  folderTitles: string[];
}

export interface FeishuMatchPreview {
  folderTitle: string;
  recordId: string;
  title: string;
  bodyPreview?: string;
  imageCount: number;
  existingImageTokens: string[];
  action: "upload" | "choose";
}

export interface PreviewFeishuMatchesResponse {
  matches: FeishuMatchPreview[];
  skippedFolderCount: number;
  skippedRecordCount: number;
}

export type FeishuUploadAction = "upload" | "skip" | "replace" | "append";

export interface UploadFeishuItem {
  action: FeishuUploadAction;
  existingTokens: string[];
  filePaths: string[];
  folderTitle: string;
  recordId: string;
}

export interface UploadFeishuMatchesRequest {
  config: FeishuUploadConfig;
  items: UploadFeishuItem[];
}

export interface UploadFeishuMatchesResponse {
  uploadedRecordCount: number;
  skippedRecordCount: number;
  failedRecords: Array<{ recordId: string; reason: string }>;
}
