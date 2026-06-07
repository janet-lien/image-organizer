import { describe, expect, it } from "vitest";
import { MockVisionAnalyzer } from "../../../src/main/vision/mockVisionAnalyzer";
import type { ImageAsset } from "../../../src/shared/types";

function asset(id: string, quality: ImageAsset["labels"]["quality"] = []): ImageAsset {
  return {
    id,
    sourcePath: `/photos/${id}.heic`,
    originalName: `${id}.heic`,
    extension: ".heic",
    createdAtMs: 1710000000000,
    hash: id,
    labels: { roles: [], quality }
  };
}

describe("MockVisionAnalyzer", () => {
  it("returns deterministic labels for each asset", async () => {
    const analyzer = new MockVisionAnalyzer();

    const result = await analyzer.analyzeBatch([asset("a1"), asset("a2", ["blurred"])]);

    expect(result.a1.scene).toBe("办公桌");
    expect(result.a1.productVariant).toBe("款式1");
    expect(result.a1.roles).toEqual(["full_set"]);
    expect(result.a2.quality).toEqual(["blurred"]);
  });
});
