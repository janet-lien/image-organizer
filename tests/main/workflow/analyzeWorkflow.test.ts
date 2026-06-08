import { describe, expect, it } from "vitest";
import { analyzeImageDirectory } from "../../../src/main/workflow/analyzeWorkflow";
import type { ImageAsset, ImageLabels } from "../../../src/shared/types";

describe("analyzeImageDirectory", () => {
  it("adds thumbnails and local quality labels before grouping", async () => {
    const assets = [asset("a1"), asset("a2")];

    const result = await analyzeImageDirectory(
      {
        budgetCny: 10,
        outputDir: "/out",
        sourceDir: "/photos",
        strategy: "by_scene",
        targetCount: { min: 1, max: 8 }
      },
      {
        analyzeBatch: async (preparedAssets) =>
          Object.fromEntries(
            preparedAssets.map((preparedAsset): [string, ImageLabels] => [
              preparedAsset.id,
              {
                scene: "办公桌",
                productVariant: "A",
                roles: ["main_subject"],
                quality: preparedAsset.labels.quality
              }
            ])
          ),
        createThumbnail: async (sourcePath) => `/cache/${sourcePath.split("/").at(-1)}.jpg`,
        inspectQuality: async (thumbnailPath) => (thumbnailPath.includes("a2") ? ["underexposed"] : []),
        scan: async () => assets
      }
    );

    expect(result.assets.map((preparedAsset) => preparedAsset.thumbnailPath)).toEqual([
      "/cache/a1.jpg.jpg",
      "/cache/a2.jpg.jpg"
    ]);
    expect(result.assets.find((preparedAsset) => preparedAsset.id === "a2")?.labels.quality).toEqual([
      "underexposed"
    ]);
    expect(result.folders[0].assetIds).toEqual(["a1"]);
    expect(result.folders[0].lowQualityAssetIds).toEqual(["a2"]);
  });
});

function asset(id: string): ImageAsset {
  return {
    id,
    sourcePath: `/photos/${id}.jpg`,
    originalName: `${id}.jpg`,
    extension: ".jpg",
    createdAtMs: id === "a1" ? 1 : 2,
    hash: id,
    labels: { roles: [], quality: [] }
  };
}
