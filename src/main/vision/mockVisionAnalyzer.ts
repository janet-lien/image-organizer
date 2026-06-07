import type { ImageAsset, ImageLabels } from "../../shared/types";
import type { VisionAnalyzer } from "./visionAnalyzer";

export class MockVisionAnalyzer implements VisionAnalyzer {
  async analyzeBatch(assets: ImageAsset[]): Promise<Record<string, ImageLabels>> {
    return Object.fromEntries(
      assets.map((asset, index) => [
        asset.id,
        {
          scene: index < assets.length / 2 ? "办公桌" : "窗边",
          productVariant: `款式${(index % 3) + 1}`,
          roles: index % 5 === 0 ? ["full_set"] : ["main_subject"],
          quality: asset.labels.quality,
          confidence: 0.85,
          explanation: "Mock analysis for deterministic development"
        }
      ])
    );
  }
}
