import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { exportReviewedFolders } from "../../../src/main/export/exporter";
import type { ImageAsset, NoteFolderDraft } from "../../../src/shared/types";

describe("exportReviewedFolders", () => {
  it("copies original files without mutating source names", async () => {
    const dir = await mkdtemp(join(tmpdir(), "xhs-export-"));
    const src = join(dir, "IMG_0001.HEIC");
    const out = join(dir, "out");
    await writeFile(src, "image");

    const asset: ImageAsset = {
      id: "a",
      sourcePath: src,
      originalName: "IMG_0001.HEIC",
      extension: ".heic",
      createdAtMs: 1,
      hash: "a",
      labels: { roles: ["main_subject"], quality: [] }
    };

    const folder: NoteFolderDraft = {
      id: "folder-01",
      index: 1,
      title: "01",
      strategy: "by_variant",
      targetCount: { min: 1, max: 3 },
      assetIds: ["a"],
      backupAssetIds: [],
      lowQualityAssetIds: [],
      reusedAssetIds: [],
      coverAssetId: "a"
    };

    const result = await exportReviewedFolders({ outputDir: out, assets: [asset], folders: [folder] });

    expect(result.copiedFiles[0].destinationPath.endsWith("01/01_封面.heic")).toBe(true);
    expect(await readFile(src, "utf8")).toBe("image");
  });
});
