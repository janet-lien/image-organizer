import { describe, expect, it } from "vitest";
import { createFolderDrafts } from "../../../src/main/grouping/groupingEngine";
import type { ImageAsset } from "../../../src/shared/types";

function asset(id: string, scene: string, variant: string): ImageAsset {
  return {
    id,
    sourcePath: `/photos/${id}.heic`,
    originalName: `${id}.heic`,
    extension: ".heic",
    createdAtMs: Number(id.replace(/\D/g, "")) || 1,
    hash: id,
    labels: { scene, productVariant: variant, roles: ["main_subject"], quality: [] }
  };
}

describe("createFolderDrafts", () => {
  it("groups by product variant for single-item notes", () => {
    const result = createFolderDrafts({
      assets: [asset("a1", "办公桌", "A"), asset("a2", "办公桌", "A"), asset("b1", "办公桌", "B")],
      strategy: "by_variant",
      targetCount: { min: 3, max: 5 }
    });

    expect(result.map((folder) => folder.assetIds)).toEqual([["a1", "a2"], ["b1"]]);
  });
});
