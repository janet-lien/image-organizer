import { useState } from "react";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  ExportReviewedRequest,
  ExportReviewedResponse,
  FeishuUploadAction,
  FeishuUploadConfig,
  PreviewFeishuMatchesRequest,
  PreviewFeishuMatchesResponse,
  SelectDirectoryRequest,
  SelectDirectoryResponse,
  UploadFeishuMatchesRequest,
  UploadFeishuMatchesResponse
} from "../shared/ipcTypes";
import type { GroupingStrategy, ImageAsset, NoteFolderDraft } from "../shared/types";
import { ImportPage } from "./pages/ImportPage";
import { defaultFeishuAction, FeishuUploadPage } from "./pages/FeishuUploadPage";
import { ReviewPage } from "./pages/ReviewPage";
import "./styles.css";

export interface ImportFormState {
  sourceDir: string;
  outputDir: string;
  strategy: GroupingStrategy;
  targetCountText: string;
  budgetCnyText: string;
}

export interface OrganizerApi {
  analyze: (request: AnalyzeRequest) => Promise<AnalyzeResponse>;
  exportReviewed: (request: ExportReviewedRequest) => Promise<ExportReviewedResponse>;
  previewFeishuMatches: (request: PreviewFeishuMatchesRequest) => Promise<PreviewFeishuMatchesResponse>;
  selectDirectory: (request: SelectDirectoryRequest) => Promise<SelectDirectoryResponse>;
  uploadFeishuMatches: (request: UploadFeishuMatchesRequest) => Promise<UploadFeishuMatchesResponse>;
}

type DirectoryField = "sourceDir" | "outputDir";
type MoveDirection = "previous" | "next";

interface AppProps {
  initialExportResult?: ExportReviewedResponse;
  initialResult?: AnalyzeResponse;
  organizerApi?: OrganizerApi;
}

declare global {
  interface Window {
    xhsOrganizer?: OrganizerApi;
  }
}

const defaultForm: ImportFormState = {
  sourceDir: "",
  outputDir: "",
  strategy: "by_scene",
  targetCountText: "5-8",
  budgetCnyText: "10"
};

const defaultFeishuConfig: FeishuUploadConfig = {
  tenantAccessToken: "",
  appToken: "",
  tableId: "",
  viewId: "",
  imageFieldName: "图片",
  titleFieldName: "标题",
  bodyFieldName: "正文",
  uploadParentType: "bitable_image"
};

export const App = ({ initialExportResult, initialResult, organizerApi }: AppProps): JSX.Element => {
  const [form, setForm] = useState<ImportFormState>(defaultForm);
  const [result, setResult] = useState<AnalyzeResponse | undefined>(initialResult);
  const [exportResult, setExportResult] = useState<ExportReviewedResponse | undefined>(initialExportResult);
  const [folders, setFolders] = useState<NoteFolderDraft[] | undefined>(initialResult?.folders);
  const [feishuConfig, setFeishuConfig] = useState<FeishuUploadConfig>(defaultFeishuConfig);
  const [feishuPreview, setFeishuPreview] = useState<PreviewFeishuMatchesResponse | undefined>();
  const [feishuFailedRecords, setFeishuFailedRecords] = useState<Array<{ recordId: string; reason: string }>>([]);
  const [feishuActions, setFeishuActions] = useState<Record<string, FeishuUploadAction>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewingFeishu, setIsPreviewingFeishu] = useState(false);
  const [isUploadingFeishu, setIsUploadingFeishu] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [exportMessage, setExportMessage] = useState<string | undefined>();
  const [feishuMessage, setFeishuMessage] = useState<string | undefined>();

  const handleAnalyze = async (): Promise<void> => {
    if (!canAnalyzeImportForm(form)) {
      setError("请选择源文件夹和输出文件夹");
      return;
    }

    const api = organizerApi ?? (typeof window !== "undefined" ? window.xhsOrganizer : undefined);
    if (!api) {
      setError("分析服务还没有准备好");
      return;
    }

    setIsAnalyzing(true);
    setError(undefined);
    try {
      const response = await api.analyze(buildAnalyzeRequest(form));
      setResult(response);
      setFolders(response.folders);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "分析失败");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectDirectory = async (field: DirectoryField): Promise<void> => {
    const api = organizerApi ?? (typeof window !== "undefined" ? window.xhsOrganizer : undefined);
    if (!api) {
      setError("文件夹选择服务还没有准备好");
      return;
    }

    try {
      const response = await api.selectDirectory({
        title: field === "sourceDir" ? "选择源文件夹" : "选择输出文件夹"
      });
      setForm((currentForm) => applySelectedDirectory(currentForm, field, response.path));
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "选择文件夹失败");
    }
  };

  const handleExport = async (assets: ImageAsset[], reviewedFolders: NoteFolderDraft[]): Promise<void> => {
    const api = organizerApi ?? (typeof window !== "undefined" ? window.xhsOrganizer : undefined);
    setIsExporting(true);
    setError(undefined);
    setExportMessage(undefined);
    try {
      const response = await handleExportAssets(
        api,
        buildExportRequest({ assets, folders: reviewedFolders, outputDir: form.outputDir })
      );
      setExportResult(response);
      setExportMessage(`已复制 ${response.copiedFiles.length} 个文件`);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "复制输出失败");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreviewFeishu = async (reviewedFolders: NoteFolderDraft[]): Promise<void> => {
    const api = organizerApi ?? (typeof window !== "undefined" ? window.xhsOrganizer : undefined);
    if (!api) {
      setError("飞书服务还没有准备好");
      return;
    }

    setIsPreviewingFeishu(true);
    setError(undefined);
    setFeishuFailedRecords([]);
    setFeishuMessage(undefined);
    try {
      const response = await api.previewFeishuMatches(
        buildFeishuPreviewRequest({ config: feishuConfig, folders: reviewedFolders })
      );
      setFeishuPreview(response);
      setFeishuActions(
        Object.fromEntries(response.matches.map((match) => [match.recordId, defaultFeishuAction(match)]))
      );
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "读取飞书记录失败");
    } finally {
      setIsPreviewingFeishu(false);
    }
  };

  const handleUploadFeishu = async (): Promise<void> => {
    const api = organizerApi ?? (typeof window !== "undefined" ? window.xhsOrganizer : undefined);
    if (!api || !exportResult || !feishuPreview) {
      setError("请先预览飞书匹配");
      return;
    }

    setIsUploadingFeishu(true);
    setError(undefined);
    setFeishuFailedRecords([]);
    setFeishuMessage(undefined);
    try {
      const response = await api.uploadFeishuMatches(
        buildFeishuUploadRequest({
          actionOverrides: feishuActions,
          config: feishuConfig,
          copiedFiles: exportResult.copiedFiles,
          preview: feishuPreview
        })
      );
      setFeishuFailedRecords(response.failedRecords);
      setFeishuMessage(
        `已上传 ${response.uploadedRecordCount} 条，跳过 ${response.skippedRecordCount} 条，失败 ${response.failedRecords.length} 条`
      );
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "飞书上传失败");
    } finally {
      setIsUploadingFeishu(false);
    }
  };

  if (result) {
    const reviewedFolders = folders ?? result.folders;
    if (exportResult) {
      return (
        <FeishuUploadPage
          actionOverrides={feishuActions}
          config={feishuConfig}
          error={error}
          failedRecords={feishuFailedRecords}
          isPreviewing={isPreviewingFeishu}
          isUploading={isUploadingFeishu}
          message={feishuMessage}
          onActionChange={(recordId, action) => setFeishuActions({ ...feishuActions, [recordId]: action })}
          onConfigChange={setFeishuConfig}
          onPreview={() => void handlePreviewFeishu(reviewedFolders)}
          onUpload={() => void handleUploadFeishu()}
          preview={feishuPreview}
        />
      );
    }

    return (
      <ReviewPage
        error={error}
        exportMessage={exportMessage}
        folders={reviewedFolders}
        isExporting={isExporting}
        onExport={() => void handleExport(result.assets, reviewedFolders)}
        onMarkLowQuality={(folderId, assetId) => {
          setFolders((currentFolders) => markAssetLowQuality(currentFolders ?? reviewedFolders, folderId, assetId));
          setExportMessage(undefined);
        }}
        onMoveAsset={(folderId, assetId, direction) => {
          setFolders((currentFolders) =>
            moveAssetToAdjacentFolder(currentFolders ?? reviewedFolders, folderId, assetId, direction)
          );
          setExportMessage(undefined);
        }}
        onRestoreLowQuality={(folderId, assetId) => {
          setFolders((currentFolders) => restoreLowQualityAsset(currentFolders ?? reviewedFolders, folderId, assetId));
          setExportMessage(undefined);
        }}
        onSelectCover={(folderId, assetId) => {
          setFolders((currentFolders) => setFolderCover(currentFolders ?? reviewedFolders, folderId, assetId));
          setExportMessage(undefined);
        }}
        result={result}
      />
    );
  }

  return (
    <ImportPage
      canAnalyze={canAnalyzeImportForm(form)}
      error={error}
      form={form}
      isAnalyzing={isAnalyzing}
      onAnalyze={handleAnalyze}
      onFormChange={setForm}
      onSelectOutputDir={() => void handleSelectDirectory("outputDir")}
      onSelectSourceDir={() => void handleSelectDirectory("sourceDir")}
    />
  );
};

async function handleExportAssets(
  api: OrganizerApi | undefined,
  request: ExportReviewedRequest
): Promise<ExportReviewedResponse> {
  if (!api) {
    throw new Error("导出服务还没有准备好");
  }
  return api.exportReviewed(request);
}

export function buildFeishuPreviewRequest(input: {
  config: FeishuUploadConfig;
  folders: NoteFolderDraft[];
}): PreviewFeishuMatchesRequest {
  return {
    config: input.config,
    folderTitles: input.folders.map((folder) => folder.title)
  };
}

export function buildFeishuUploadRequest(input: {
  actionOverrides: Record<string, FeishuUploadAction>;
  config: FeishuUploadConfig;
  copiedFiles: ExportReviewedResponse["copiedFiles"];
  preview: PreviewFeishuMatchesResponse;
}): UploadFeishuMatchesRequest {
  const pathsByFolder = groupCopiedFilesByFolder(input.copiedFiles);
  return {
    config: input.config,
    items: input.preview.matches.map((match) => ({
      action: input.actionOverrides[match.recordId] ?? defaultFeishuAction(match),
      existingTokens: match.existingImageTokens,
      filePaths: pathsByFolder.get(match.folderTitle) ?? [],
      folderTitle: match.folderTitle,
      recordId: match.recordId
    }))
  };
}

export function setFolderCover(
  folders: NoteFolderDraft[],
  folderId: string,
  assetId: string
): NoteFolderDraft[] {
  return folders.map((folder) =>
    folder.id === folderId && folder.assetIds.includes(assetId) ? { ...folder, coverAssetId: assetId } : folder
  );
}

export function moveAssetToAdjacentFolder(
  folders: NoteFolderDraft[],
  folderId: string,
  assetId: string,
  direction: MoveDirection
): NoteFolderDraft[] {
  const sourceIndex = folders.findIndex((folder) => folder.id === folderId);
  const targetIndex = direction === "previous" ? sourceIndex - 1 : sourceIndex + 1;
  const source = folders[sourceIndex];

  if (!source || targetIndex < 0 || targetIndex >= folders.length || !source.assetIds.includes(assetId)) {
    return folders;
  }

  return folders.map((folder, index) => {
    if (index === sourceIndex) {
      return {
        ...folder,
        assetIds: withoutAsset(folder.assetIds, assetId),
        coverAssetId: folder.coverAssetId === assetId ? undefined : folder.coverAssetId
      };
    }

    if (index === targetIndex) {
      return {
        ...folder,
        assetIds: appendAsset(folder.assetIds, assetId),
        lowQualityAssetIds: withoutAsset(folder.lowQualityAssetIds, assetId)
      };
    }

    return folder;
  });
}

export function markAssetLowQuality(
  folders: NoteFolderDraft[],
  folderId: string,
  assetId: string
): NoteFolderDraft[] {
  return folders.map((folder) => {
    if (folder.id !== folderId || !folder.assetIds.includes(assetId)) {
      return folder;
    }

    return {
      ...folder,
      assetIds: withoutAsset(folder.assetIds, assetId),
      coverAssetId: folder.coverAssetId === assetId ? undefined : folder.coverAssetId,
      lowQualityAssetIds: appendAsset(folder.lowQualityAssetIds, assetId)
    };
  });
}

export function restoreLowQualityAsset(
  folders: NoteFolderDraft[],
  folderId: string,
  assetId: string
): NoteFolderDraft[] {
  return folders.map((folder) => {
    if (folder.id !== folderId || !folder.lowQualityAssetIds.includes(assetId)) {
      return folder;
    }

    return {
      ...folder,
      assetIds: appendAsset(folder.assetIds, assetId),
      lowQualityAssetIds: withoutAsset(folder.lowQualityAssetIds, assetId)
    };
  });
}

export function applySelectedDirectory(
  form: ImportFormState,
  field: DirectoryField,
  path: string | undefined
): ImportFormState {
  return path ? { ...form, [field]: path } : form;
}

function appendAsset(assetIds: string[], assetId: string): string[] {
  return assetIds.includes(assetId) ? assetIds : [...assetIds, assetId];
}

function withoutAsset(assetIds: string[], assetId: string): string[] {
  return assetIds.filter((id) => id !== assetId);
}

export function buildExportRequest(input: {
  assets: ImageAsset[];
  folders: NoteFolderDraft[];
  outputDir: string;
}): ExportReviewedRequest {
  return {
    assets: input.assets,
    folders: input.folders,
    outputDir: input.outputDir.trim()
  };
}

export function buildAnalyzeRequest(form: ImportFormState): AnalyzeRequest {
  return {
    sourceDir: form.sourceDir.trim(),
    outputDir: form.outputDir.trim(),
    strategy: form.strategy,
    targetCount: parseTargetCount(form.targetCountText),
    budgetCny: Math.max(0, Number.parseFloat(form.budgetCnyText) || 0)
  };
}

export function canAnalyzeImportForm(form: ImportFormState): boolean {
  return form.sourceDir.trim().length > 0 && form.outputDir.trim().length > 0;
}

function parseTargetCount(value: string): { min: number; max: number } {
  const [rawMin, rawMax] = value.split("-").map((part) => Number.parseInt(part.trim(), 10));
  const min = Math.max(1, Number.isFinite(rawMin) ? rawMin : 1);
  const max = Math.max(1, Number.isFinite(rawMax) ? rawMax : min);
  return { min, max: Math.max(min, max) };
}

function groupCopiedFilesByFolder(
  copiedFiles: ExportReviewedResponse["copiedFiles"]
): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const file of copiedFiles) {
    const parts = file.destinationPath.split(/[\\/]/);
    const folderTitle = parts.at(-2);
    if (!folderTitle) continue;
    grouped.set(folderTitle, [...(grouped.get(folderTitle) ?? []), file.destinationPath]);
  }
  return grouped;
}
