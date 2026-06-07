import type { NoteFolderDraft } from "../../shared/types";

interface FolderCardProps {
  folder: NoteFolderDraft;
}

export function FolderCard({ folder }: FolderCardProps): JSX.Element {
  return (
    <article className="folder-card">
      <header>
        <h2>{folder.title}</h2>
        <span>{folder.assetIds.length} 张</span>
      </header>
      <p>备选 {folder.backupAssetIds.length} 张</p>
    </article>
  );
}
