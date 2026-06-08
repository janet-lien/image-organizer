import type { ImageAsset, NoteFolderDraft } from "../../shared/types";

interface FolderCardProps {
  assets: ImageAsset[];
  folder: NoteFolderDraft;
  onSelectCover: (folderId: string, assetId: string) => void;
}

export function FolderCard({ assets, folder, onSelectCover }: FolderCardProps): JSX.Element {
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

  return (
    <article className="folder-card">
      <header>
        <h2>{folder.title}</h2>
        <span>{folder.assetIds.length} 张</span>
      </header>
      <p>备选 {folder.backupAssetIds.length} 张</p>
      <div className="asset-list">
        {folder.assetIds.map((assetId) => {
          const asset = assetMap.get(assetId);
          const selected = folder.coverAssetId === assetId;
          return (
            <div className="asset-row" key={assetId}>
              <span>{asset?.originalName ?? assetId}</span>
              <button
                className={selected ? "selected" : undefined}
                onClick={() => onSelectCover(folder.id, assetId)}
                type="button"
              >
                {selected ? "已选封面" : "选择封面"}
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );
}
