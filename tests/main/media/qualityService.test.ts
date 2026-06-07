import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { inspectThumbnailQuality } from "../../../src/main/media/qualityService";

describe("inspectThumbnailQuality", () => {
  it("marks tiny dark images as low quality", async () => {
    const dir = await mkdtemp(join(tmpdir(), "xhs-quality-"));
    const file = join(dir, "dark.jpg");
    await sharp({
      create: {
        width: 120,
        height: 120,
        channels: 3,
        background: { r: 5, g: 5, b: 5 }
      }
    })
      .jpeg()
      .toFile(file);

    const result = await inspectThumbnailQuality(file);

    expect(result).toContain("low_resolution");
    expect(result).toContain("underexposed");
  });
});
