import { describe, expect, it } from "vitest";
import { orderAssetsForPublishing } from "../../../src/main/grouping/ordering";
import type { ImageAsset, ImageRole } from "../../../src/shared/types";

function asset(id: string, role: ImageRole, createdAtMs: number): ImageAsset {
  return {
    id,
    sourcePath: `/photos/${id}.heic`,
    originalName: `${id}.heic`,
    extension: ".heic",
    createdAtMs,
    hash: id,
    labels: { roles: [role], quality: [] }
  };
}

describe("orderAssetsForPublishing", () => {
  it("keeps the selected cover first and sorts the rest by publishing role", () => {
    const result = orderAssetsForPublishing(
      [asset("detail", "detail", 1), asset("cover", "comparison", 2), asset("main", "main_subject", 3)],
      "cover"
    );

    expect(result.map((item) => item.id)).toEqual(["cover", "main", "detail"]);
  });
});
