import type { ImageAsset, ImageLabels } from "../../shared/types";

export interface VisionAnalyzer {
  analyzeBatch(assets: ImageAsset[]): Promise<Record<string, ImageLabels>>;
}
