import { APP_NAME, DEFAULT_BATCH_BUDGET_CNY, SUPPORTED_IMAGE_EXTENSIONS } from "../shared/constants";

export const App = (): JSX.Element => {
  return (
    <main className="app-shell">
      <section className="workspace-panel" aria-labelledby="app-title">
        <p className="eyebrow">静态图片整理工具</p>
        <h1 id="app-title">{APP_NAME}</h1>
        <p className="summary">导入 HEIC、JPG、PNG 图片后，按成篇策略整理成待确认的笔记文件夹。</p>
        <dl className="status-grid">
          <div>
            <dt>支持格式</dt>
            <dd>{SUPPORTED_IMAGE_EXTENSIONS.join(" / ")}</dd>
          </div>
          <div>
            <dt>默认预算</dt>
            <dd>¥{DEFAULT_BATCH_BUDGET_CNY}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
};
