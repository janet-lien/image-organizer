import type {
  FeishuMatchPreview,
  FeishuUploadAction,
  FeishuUploadConfig,
  PreviewFeishuMatchesResponse
} from "../../shared/ipcTypes";

interface FeishuUploadPageProps {
  actionOverrides: Record<string, FeishuUploadAction>;
  config: FeishuUploadConfig;
  error?: string;
  failedRecords?: Array<{ recordId: string; reason: string }>;
  isPreviewing: boolean;
  isUploading: boolean;
  message?: string;
  onActionChange: (recordId: string, action: FeishuUploadAction) => void;
  onConfigChange: (config: FeishuUploadConfig) => void;
  onPreview: () => void;
  onUpload: () => void;
  preview?: PreviewFeishuMatchesResponse;
}

export function FeishuUploadPage({
  actionOverrides,
  config,
  error,
  failedRecords = [],
  isPreviewing,
  isUploading,
  message,
  onActionChange,
  onConfigChange,
  onPreview,
  onUpload,
  preview
}: FeishuUploadPageProps): JSX.Element {
  const update = (patch: Partial<FeishuUploadConfig>): void => onConfigChange({ ...config, ...patch });
  const canPreview = canPreviewFeishuMatches(config);

  return (
    <main className="page">
      <header className="toolbar">
        <h1>飞书上传</h1>
      </header>

      <section className="panel">
        <label htmlFor="tenant-access-token">Tenant Access Token</label>
        <input
          id="tenant-access-token"
          onChange={(event) => update({ tenantAccessToken: event.currentTarget.value })}
          type="password"
          value={config.tenantAccessToken}
        />

        <label htmlFor="app-token">App Token</label>
        <input id="app-token" onChange={(event) => update({ appToken: event.currentTarget.value })} value={config.appToken} />

        <label htmlFor="table-id">Table ID</label>
        <input id="table-id" onChange={(event) => update({ tableId: event.currentTarget.value })} value={config.tableId} />

        <label htmlFor="view-id">View ID</label>
        <input id="view-id" onChange={(event) => update({ viewId: event.currentTarget.value })} value={config.viewId} />

        <label htmlFor="image-field">图片字段</label>
        <input
          id="image-field"
          onChange={(event) => update({ imageFieldName: event.currentTarget.value })}
          value={config.imageFieldName}
        />

        <label htmlFor="title-field">标题字段</label>
        <input
          id="title-field"
          onChange={(event) => update({ titleFieldName: event.currentTarget.value })}
          value={config.titleFieldName}
        />

        <label htmlFor="body-field">正文字段</label>
        <input id="body-field" onChange={(event) => update({ bodyFieldName: event.currentTarget.value })} value={config.bodyFieldName} />

        <label htmlFor="upload-parent-type">上传类型</label>
        <select
          id="upload-parent-type"
          onChange={(event) => update({ uploadParentType: event.currentTarget.value as FeishuUploadConfig["uploadParentType"] })}
          value={config.uploadParentType}
        >
          <option value="bitable_image">多维表格图片</option>
          <option value="bitable_file">多维表格文件</option>
        </select>

        <button className="primary" disabled={!canPreview || isPreviewing} onClick={onPreview} type="button">
          {isPreviewing ? "读取中..." : "预览匹配"}
        </button>
      </section>

      {error ? <p className="error-message">{error}</p> : null}
      {message ? <p className="success-message">{message}</p> : null}
      {failedRecords.length > 0 ? (
        <section className="failure-panel" aria-label="上传失败">
          <h2>上传失败</h2>
          <div className="match-list">
            {failedRecords.map((record) => (
              <article className="match-row" key={record.recordId}>
                <div>
                  <strong>{record.recordId}</strong>
                  <span>{record.reason}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {preview ? (
        <section className="match-panel" aria-label="飞书匹配">
          <header>
            <h2>匹配结果</h2>
            <button className="primary" disabled={isUploading || preview.matches.length === 0} onClick={onUpload} type="button">
              {isUploading ? "上传中..." : "开始上传"}
            </button>
          </header>
          <div className="match-list">
            {preview.matches.map((match) => (
              <MatchRow
                action={actionOverrides[match.recordId] ?? defaultFeishuAction(match)}
                key={match.recordId}
                match={match}
                onActionChange={onActionChange}
              />
            ))}
          </div>
          <p className="muted">
            跳过文件夹 {preview.skippedFolderCount} 个，跳过记录 {preview.skippedRecordCount} 条
          </p>
        </section>
      ) : (
        <button className="primary" disabled type="button">
          开始上传
        </button>
      )}
    </main>
  );
}

function MatchRow({
  action,
  match,
  onActionChange
}: {
  action: FeishuUploadAction;
  match: FeishuMatchPreview;
  onActionChange: (recordId: string, action: FeishuUploadAction) => void;
}): JSX.Element {
  return (
    <article className="match-row">
      <div>
        <strong>{match.folderTitle}</strong>
        <span>{match.title}</span>
        <small>{match.imageCount > 0 ? `已有 ${match.imageCount} 张图片` : "暂无图片"}</small>
      </div>
      <select
        onChange={(event) => onActionChange(match.recordId, event.currentTarget.value as FeishuUploadAction)}
        value={action}
      >
        {match.action === "upload" ? (
          <>
            <option value="upload">上传</option>
            <option value="skip">跳过</option>
          </>
        ) : (
          <>
            <option value="skip">跳过</option>
            <option value="replace">替换</option>
            <option value="append">追加</option>
          </>
        )}
      </select>
    </article>
  );
}

export function defaultFeishuAction(match: FeishuMatchPreview): FeishuUploadAction {
  return match.action === "upload" ? "upload" : "skip";
}

export function canPreviewFeishuMatches(config: FeishuUploadConfig): boolean {
  return [
    config.tenantAccessToken,
    config.appToken,
    config.tableId,
    config.viewId,
    config.imageFieldName,
    config.titleFieldName
  ].every((value) => value.trim().length > 0);
}
