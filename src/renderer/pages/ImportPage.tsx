export function ImportPage(): JSX.Element {
  return (
    <main className="page">
      <header className="toolbar">
        <h1>导入素材</h1>
      </header>

      <form className="panel">
        <label htmlFor="source-dir">源文件夹</label>
        <input id="source-dir" placeholder="/Users/jen/Desktop/photos" />

        <label htmlFor="output-dir">输出文件夹</label>
        <input id="output-dir" placeholder="/Users/jen/Desktop/output" />

        <label>成篇策略</label>
        <div className="segmented" role="group" aria-label="成篇策略">
          <button type="button">按场景成篇</button>
          <button type="button">按款式成篇</button>
          <button type="button">同场景精选</button>
          <button type="button">自定义</button>
        </div>

        <label htmlFor="target-count">目标张数</label>
        <input id="target-count" placeholder="5-8" />

        <button className="primary" type="button">
          开始分析
        </button>
      </form>
    </main>
  );
}
