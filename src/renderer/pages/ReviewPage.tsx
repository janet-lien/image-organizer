import { CostTimeEstimate } from "../components/CostTimeEstimate";
import { FolderCard } from "../components/FolderCard";
import type { AnalyzeResponse } from "../../shared/ipcTypes";
import type { NoteFolderDraft } from "../../shared/types";

interface ReviewPageProps {
  error?: string;
  exportMessage?: string;
  folders: NoteFolderDraft[];
  isExporting: boolean;
  onExport: () => void;
  onSelectCover: (folderId: string, assetId: string) => void;
  result: AnalyzeResponse;
}

export function ReviewPage({
  error,
  exportMessage,
  folders,
  isExporting,
  onExport,
  onSelectCover,
  result
}: ReviewPageProps): JSX.Element {
  const readyForExport = folders.every((folder) => folder.assetIds.length === 0 || Boolean(folder.coverAssetId));

  return (
    <main className="page">
      <header className="toolbar">
        <h1>确认分组</h1>
        <button className="primary" disabled={!readyForExport || isExporting} onClick={onExport} type="button">
          {isExporting ? "复制中..." : "复制输出"}
        </button>
      </header>

      <CostTimeEstimate estimate={result.estimate} />
      {error ? <p className="error-message">{error}</p> : null}
      {exportMessage ? <p className="success-message">{exportMessage}</p> : null}
      <section className="folder-grid" aria-label="笔记文件夹">
        {folders.map((folder) => (
          <FolderCard assets={result.assets} folder={folder} key={folder.id} onSelectCover={onSelectCover} />
        ))}
      </section>
    </main>
  );
}
