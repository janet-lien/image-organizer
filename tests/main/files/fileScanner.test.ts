import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scanImageDirectory } from "../../../src/main/files/fileScanner";

describe("scanImageDirectory", () => {
  it("keeps supported static images sorted by filename", async () => {
    const dir = await mkdtemp(join(tmpdir(), "xhs-scan-"));
    await writeFile(join(dir, "IMG_0002.HEIC"), "two");
    await writeFile(join(dir, "IMG_0001.jpg"), "one");
    await writeFile(join(dir, "clip.mov"), "movie");

    const result = await scanImageDirectory(dir);

    expect(result.map((asset) => asset.originalName)).toEqual(["IMG_0001.jpg", "IMG_0002.HEIC"]);
    expect(result.every((asset) => asset.hash.length === 64)).toBe(true);
  });
});
