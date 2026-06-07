import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { ImageAsset, NoteFolderDraft } from "../../shared/types";
import { orderAssetsForPublishing } from "../grouping/ordering";
import { validateReadyForExport } from "../review/reviewState";

export async function exportReviewedFolders(input: {
  outputDir: string;
  assets: ImageAsset[];
  folders: NoteFolderDraft[];
}): Promise<{ copiedFiles: Array<{ sourcePath: string; destinationPath: string }> }> {
  const validation = validateReadyForExport(input.folders);
  if (!validation.ready) {
    throw new Error(`Missing cover for folders: ${validation.missingCoverFolderIds.join(", ")}`);
  }

  const assetMap = new Map(input.assets.map((asset) => [asset.id, asset]));
  const copiedFiles: Array<{ sourcePath: string; destinationPath: string }> = [];

  for (const folder of input.folders) {
    const folderDir = join(input.outputDir, folder.title);
    await mkdir(folderDir, { recursive: true });

    const assets = folder.assetIds
      .map((id) => assetMap.get(id))
      .filter((asset): asset is ImageAsset => Boolean(asset));
    const ordered = orderAssetsForPublishing(assets, folder.coverAssetId!);

    for (const [index, asset] of ordered.entries()) {
      const label = index === 0 ? "封面" : roleLabel(asset);
      const destinationPath = join(folderDir, `${String(index + 1).padStart(2, "0")}_${label}${asset.extension}`);
      await copyFile(asset.sourcePath, destinationPath);
      copiedFiles.push({ sourcePath: asset.sourcePath, destinationPath });
    }
  }

  return { copiedFiles };
}

function roleLabel(asset: ImageAsset): string {
  const role = asset.labels.roles[0];
  if (role === "wide_scene") return "远景";
  if (role === "angle") return "角度";
  if (role === "detail") return "细节";
  if (role === "function_material") return "功能材质";
  if (role === "comparison") return "对比";
  if (role === "full_set") return "合照";
  return "主图";
}
