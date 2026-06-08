import type { ImportFormState } from "../App";
import type { GroupingStrategy } from "../../shared/types";

interface ImportPageProps {
  canAnalyze: boolean;
  error?: string;
  form: ImportFormState;
  isAnalyzing: boolean;
  onAnalyze: () => Promise<void>;
  onFormChange: (form: ImportFormState) => void;
  onSelectOutputDir: () => void;
  onSelectSourceDir: () => void;
}

const strategies: Array<{ label: string; value: GroupingStrategy }> = [
  { label: "按场景成篇", value: "by_scene" },
  { label: "按款式成篇", value: "by_variant" },
  { label: "同场景精选", value: "scene_best" },
  { label: "自定义", value: "custom" }
];

export function ImportPage({
  canAnalyze,
  error,
  form,
  isAnalyzing,
  onAnalyze,
  onFormChange,
  onSelectOutputDir,
  onSelectSourceDir
}: ImportPageProps): JSX.Element {
  const update = (patch: Partial<ImportFormState>): void => onFormChange({ ...form, ...patch });

  return (
    <main className="page">
      <header className="toolbar">
        <h1>导入素材</h1>
      </header>

      <form
        className="panel"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <label htmlFor="source-dir">源文件夹</label>
        <div className="path-row">
          <input
            id="source-dir"
            onChange={(event) => update({ sourceDir: event.currentTarget.value })}
            placeholder="/Users/jen/Desktop/photos"
            value={form.sourceDir}
          />
          <button onClick={onSelectSourceDir} type="button">
            选择源文件夹
          </button>
        </div>

        <label htmlFor="output-dir">输出文件夹</label>
        <div className="path-row">
          <input
            id="output-dir"
            onChange={(event) => update({ outputDir: event.currentTarget.value })}
            placeholder="/Users/jen/Desktop/output"
            value={form.outputDir}
          />
          <button onClick={onSelectOutputDir} type="button">
            选择输出文件夹
          </button>
        </div>

        <label>成篇策略</label>
        <div className="segmented" role="group" aria-label="成篇策略">
          {strategies.map((strategy) => (
            <button
              aria-pressed={form.strategy === strategy.value}
              className={form.strategy === strategy.value ? "selected" : undefined}
              key={strategy.value}
              onClick={() => update({ strategy: strategy.value })}
              type="button"
            >
              {strategy.label}
            </button>
          ))}
        </div>

        <label htmlFor="target-count">目标张数</label>
        <input
          id="target-count"
          onChange={(event) => update({ targetCountText: event.currentTarget.value })}
          placeholder="5-8"
          value={form.targetCountText}
        />

        <label htmlFor="budget-cny">预算</label>
        <input
          id="budget-cny"
          onChange={(event) => update({ budgetCnyText: event.currentTarget.value })}
          placeholder="10"
          value={form.budgetCnyText}
        />

        {error ? <p className="error-message">{error}</p> : null}

        <button className="primary" disabled={!canAnalyze || isAnalyzing} onClick={() => void onAnalyze()} type="button">
          {isAnalyzing ? "分析中..." : "开始分析"}
        </button>
      </form>
    </main>
  );
}
