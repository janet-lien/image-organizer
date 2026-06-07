import { readdir, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import { SUPPORTED_IMAGE_EXTENSIONS } from "../../shared/constants";
import type { ImageAsset, SupportedImageExtension } from "../../shared/types";
import { hashFile } from "./fileHasher";

const supported = new Set<string>(SUPPORTED_IMAGE_EXTENSIONS);

export async function scanImageDirectory(dir: string): Promise<ImageAsset[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => supported.has(extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

  const assets: ImageAsset[] = [];
  for (const name of files) {
    const sourcePath = join(dir, name);
    const info = await stat(sourcePath);
    const hash = await hashFile(sourcePath);
    assets.push({
      id: `sha256:${hash}`,
      sourcePath,
      originalName: name,
      extension: extname(name).toLowerCase() as SupportedImageExtension,
      createdAtMs: info.birthtimeMs || info.mtimeMs,
      hash,
      labels: { roles: [], quality: [] }
    });
  }

  return assets;
}
