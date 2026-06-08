import { mkdtemp, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { exportReviewedFolders } from "../../src/main/export/exporter";
import { scanImageDirectory } from "../../src/main/files/fileScanner";
import { createFolderDrafts } from "../../src/main/grouping/groupingEngine";
import { setCover } from "../../src/main/review/reviewState";
import { MockVisionAnalyzer } from "../../src/main/vision/mockVisionAnalyzer";

describe("static organizer local workflow", () => {
  it("scans, analyzes, groups, selects cover, and copies output", async () => {
    const dir = await mkdtemp(join(tmpdir(), "xhs-workflow-"));
    const out = join(dir, "out");
    await writeFile(join(dir, "IMG_0001.jpg"), "one");
    await writeFile(join(dir, "IMG_0002.jpg"), "two");

    const scanned = await scanImageDirectory(dir);
    const labels = await new MockVisionAnalyzer().analyzeBatch(scanned);
    const analyzed = scanned.map((asset) => ({ ...asset, labels: labels[asset.id] }));
    const [folder] = createFolderDrafts({
      assets: analyzed,
      strategy: "by_scene",
      targetCount: { min: 1, max: 8 }
    });
    const reviewed = setCover(folder, folder.assetIds[0]);

    await exportReviewedFolders({ outputDir: out, assets: analyzed, folders: [reviewed] });

    expect(await readdir(join(out, "01"))).toContain("01_封面.jpg");
  });
});
