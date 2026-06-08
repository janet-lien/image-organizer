import type { ImageAsset, NoteFolderDraft } from "../../shared/types";

interface FolderCardProps {
  assets: ImageAsset[];
  canMoveNext: boolean;
  canMovePrevious: boolean;
  folder: NoteFolderDraft;
  onMarkLowQuality: (folderId: string, assetId: string) => void;
  onMoveAsset: (folderId: string, assetId: string, direction: "previous" | "next") => void;
  onRestoreLowQuality: (folderId: string, assetId: string) => void;
  onSelectCover: (folderId: string, assetId: string) => void;
}

export function FolderCard({
  assets,
  canMoveNext,
  canMovePrevious,
  folder,
  onMarkLowQuality,
  onMoveAsset,
  onRestoreLowQuality,
  onSelectCover
}: FolderCardProps): JSX.Element {
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

  return (
    <article className="folder-card">
      <header>
        <h2>{folder.title}</h2>
        <span>{folder.assetIds.length} 张</span>
      </header>
      <p>备选 {folder.backupAssetIds.length} 张</p>
      <p>低质量 {folder.lowQualityAssetIds.length} 张</p>
      <div className="asset-list">
        {folder.assetIds.map((assetId) => {
          const asset = assetMap.get(assetId);
          const selected = folder.coverAssetId === assetId;
          return (
            <div className="asset-row" key={assetId}>
              <div className={asset?.thumbnailPath ? "asset-summary" : "asset-summary no-thumb"}>
                {asset?.thumbnailPath ? (
                  <img alt={asset.originalName} className="asset-thumb" src={toFileUrl(asset.thumbnailPath)} />
                ) : null}
                <span>{asset?.originalName ?? assetId}</span>
              </div>
              <div className="asset-actions">
                <button
                  className={selected ? "selected" : undefined}
                  onClick={() => onSelectCover(folder.id, assetId)}
                  type="button"
                >
                  {selected ? "已选封面" : "选择封面"}
                </button>
                <button disabled={!canMovePrevious} onClick={() => onMoveAsset(folder.id, assetId, "previous")} type="button">
                  上一组
                </button>
                <button disabled={!canMoveNext} onClick={() => onMoveAsset(folder.id, assetId, "next")} type="button">
                  下一组
                </button>
                <button onClick={() => onMarkLowQuality(folder.id, assetId)} type="button">
                  低质量
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {folder.lowQualityAssetIds.length > 0 ? (
        <div className="asset-list low-quality-list" aria-label={`${folder.title} 低质量图片`}>
          {folder.lowQualityAssetIds.map((assetId) => {
            const asset = assetMap.get(assetId);
            return (
              <div className="asset-row" key={assetId}>
                <div className={asset?.thumbnailPath ? "asset-summary" : "asset-summary no-thumb"}>
                  {asset?.thumbnailPath ? (
                    <img alt={asset.originalName} className="asset-thumb" src={toFileUrl(asset.thumbnailPath)} />
                  ) : null}
                  <span>{asset?.originalName ?? assetId}</span>
                </div>
                <div className="asset-actions">
                  <button onClick={() => onRestoreLowQuality(folder.id, assetId)} type="button">
                    移回正式
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}

function toFileUrl(path: string): string {
  return encodeURI(path.startsWith("/") ? `file://${path}` : path);
}
