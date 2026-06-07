import type { BatchEstimate, GroupingStrategy, NoteFolderDraft, TargetCount } from "./types";

export interface AnalyzeRequest {
  sourceDir: string;
  outputDir: string;
  strategy: GroupingStrategy;
  targetCount: TargetCount;
  budgetCny: number;
}

export interface AnalyzeResponse {
  estimate: BatchEstimate;
  folders: NoteFolderDraft[];
}
