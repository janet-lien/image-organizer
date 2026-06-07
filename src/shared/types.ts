export type SupportedImageExtension = ".heic" | ".jpg" | ".jpeg" | ".png";

export type GroupingStrategy = "by_scene" | "by_variant" | "scene_best" | "custom";

export type ImageRole =
  | "wide_scene"
  | "main_subject"
  | "angle"
  | "detail"
  | "function_material"
  | "comparison"
  | "full_set";

export type QualityIssue =
  | "blurred"
  | "overexposed"
  | "underexposed"
  | "low_resolution"
  | "duplicate"
  | "weak_composition"
  | "occluded_subject";

export interface ImageLabels {
  scene?: string;
  productVariant?: string;
  roles: ImageRole[];
  quality: QualityIssue[];
  confidence?: number;
  explanation?: string;
}

export interface ImageAsset {
  id: string;
  sourcePath: string;
  originalName: string;
  extension: SupportedImageExtension;
  createdAtMs: number;
  width?: number;
  height?: number;
  hash: string;
  thumbnailPath?: string;
  labels: ImageLabels;
}

export interface TargetCount {
  min: number;
  max: number;
}

export interface NoteFolderDraft {
  id: string;
  index: number;
  title: string;
  strategy: GroupingStrategy;
  targetCount: TargetCount;
  assetIds: string[];
  backupAssetIds: string[];
  lowQualityAssetIds: string[];
  reusedAssetIds: string[];
  coverAssetId?: string;
}

export interface BatchEstimate {
  imageCount: number;
  estimatedCostCny: { min: number; max: number };
  estimatedAnalysisMinutes: { min: number; max: number };
  requiresBudgetConfirmation: boolean;
}
