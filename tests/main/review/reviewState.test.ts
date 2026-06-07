import { describe, expect, it } from "vitest";
import { setCover, validateReadyForExport } from "../../../src/main/review/reviewState";
import type { NoteFolderDraft } from "../../../src/shared/types";

const folder: NoteFolderDraft = {
  id: "folder-01",
  index: 1,
  title: "01",
  strategy: "by_variant",
  targetCount: { min: 3, max: 5 },
  assetIds: ["a", "b"],
  backupAssetIds: [],
  lowQualityAssetIds: [],
  reusedAssetIds: []
};

describe("reviewState", () => {
  it("requires a user-selected cover before export", () => {
    expect(validateReadyForExport([folder])).toEqual({
      ready: false,
      missingCoverFolderIds: ["folder-01"]
    });
  });

  it("sets a cover only from formal assets", () => {
    const updated = setCover(folder, "b");

    expect(updated.coverAssetId).toBe("b");
  });
});
