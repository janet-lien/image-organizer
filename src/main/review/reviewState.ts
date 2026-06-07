import type { NoteFolderDraft } from "../../shared/types";

export function setCover(folder: NoteFolderDraft, assetId: string): NoteFolderDraft {
  if (!folder.assetIds.includes(assetId)) {
    throw new Error(`Cover asset ${assetId} is not in folder ${folder.id}`);
  }

  return { ...folder, coverAssetId: assetId };
}

export function validateReadyForExport(folders: NoteFolderDraft[]): {
  ready: boolean;
  missingCoverFolderIds: string[];
} {
  const missingCoverFolderIds = folders
    .filter((folder) => folder.assetIds.length > 0 && !folder.coverAssetId)
    .map((folder) => folder.id);

  return { ready: missingCoverFolderIds.length === 0, missingCoverFolderIds };
}
