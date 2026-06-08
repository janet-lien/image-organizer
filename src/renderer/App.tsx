import { useState } from "react";
import type { AnalyzeRequest, AnalyzeResponse, ExportReviewedRequest, ExportReviewedResponse } from "../shared/ipcTypes";
import type { GroupingStrategy, ImageAsset, NoteFolderDraft } from "../shared/types";
import { ImportPage } from "./pages/ImportPage";
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
}

interface AppProps {
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

export const App = ({ initialResult, organizerApi }: AppProps): JSX.Element => {
  const [form, setForm] = useState<ImportFormState>(defaultForm);
  const [result, setResult] = useState<AnalyzeResponse | undefined>(initialResult);
  const [folders, setFolders] = useState<NoteFolderDraft[] | undefined>(initialResult?.folders);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [exportMessage, setExportMessage] = useState<string | undefined>();

  const handleAnalyze = async (): Promise<void> => {
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
      setExportMessage(`已复制 ${response.copiedFiles.length} 个文件`);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "复制输出失败");
    } finally {
      setIsExporting(false);
    }
  };

  if (result) {
    const reviewedFolders = folders ?? result.folders;
    return (
      <ReviewPage
        error={error}
        exportMessage={exportMessage}
        folders={reviewedFolders}
        isExporting={isExporting}
        onExport={() => void handleExport(result.assets, reviewedFolders)}
        onSelectCover={(folderId, assetId) => {
          setFolders(setFolderCover(reviewedFolders, folderId, assetId));
          setExportMessage(undefined);
        }}
        result={result}
      />
    );
  }

  return (
    <ImportPage
      error={error}
      form={form}
      isAnalyzing={isAnalyzing}
      onAnalyze={handleAnalyze}
      onFormChange={setForm}
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

export function setFolderCover(
  folders: NoteFolderDraft[],
  folderId: string,
  assetId: string
): NoteFolderDraft[] {
  return folders.map((folder) =>
    folder.id === folderId && folder.assetIds.includes(assetId) ? { ...folder, coverAssetId: assetId } : folder
  );
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
    budgetCny: Number.parseFloat(form.budgetCnyText) || 0
  };
}

function parseTargetCount(value: string): { min: number; max: number } {
  const [rawMin, rawMax] = value.split("-").map((part) => Number.parseInt(part.trim(), 10));
  const min = Number.isFinite(rawMin) ? rawMin : 1;
  const max = Number.isFinite(rawMax) ? rawMax : min;
  return { min, max: Math.max(min, max) };
}
