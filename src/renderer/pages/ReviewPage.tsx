import { CostTimeEstimate } from "../components/CostTimeEstimate";
import { FolderCard } from "../components/FolderCard";
import type { AnalyzeResponse } from "../../shared/ipcTypes";

interface ReviewPageProps {
  result: AnalyzeResponse;
}

export function ReviewPage({ result }: ReviewPageProps): JSX.Element {
  return (
    <main className="page">
      <header className="toolbar">
        <h1>确认分组</h1>
      </header>

      <CostTimeEstimate estimate={result.estimate} />
      <section className="folder-grid" aria-label="笔记文件夹">
        {result.folders.map((folder) => (
          <FolderCard folder={folder} key={folder.id} />
        ))}
      </section>
    </main>
  );
}
