import { describe, expect, it } from "vitest";
import type { ImageAsset, NoteFolderDraft } from "../../../src/shared/types";

describe("shared domain types", () => {
  it("represents an image asset and a note folder draft", () => {
    const asset: ImageAsset = {
      id: "sha256:abc",
      sourcePath: "/photos/IMG_0001.HEIC",
      originalName: "IMG_0001.HEIC",
      extension: ".heic",
      createdAtMs: 1710000000000,
      width: 3024,
      height: 4032,
      hash: "abc",
      thumbnailPath: "/cache/abc.jpg",
      labels: {
        scene: "办公桌",
        productVariant: "款式A",
        roles: ["main_subject"],
        quality: []
      }
    };

    const folder: NoteFolderDraft = {
      id: "folder-01",
      index: 1,
      title: "01",
      strategy: "by_variant",
      targetCount: { min: 5, max: 8 },
      assetIds: [asset.id],
      backupAssetIds: [],
      lowQualityAssetIds: [],
      reusedAssetIds: [],
      coverAssetId: asset.id
    };

    expect(folder.assetIds).toEqual(["sha256:abc"]);
  });
});
