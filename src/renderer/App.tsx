import { useState } from "react";
import type { AnalyzeRequest, AnalyzeResponse } from "../shared/ipcTypes";
import type { GroupingStrategy } from "../shared/types";
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleAnalyze = async (): Promise<void> => {
    const api = organizerApi ?? (typeof window !== "undefined" ? window.xhsOrganizer : undefined);
    if (!api) {
      setError("分析服务还没有准备好");
      return;
    }

    setIsAnalyzing(true);
    setError(undefined);
    try {
      setResult(await api.analyze(buildAnalyzeRequest(form)));
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "分析失败");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (result) {
    return <ReviewPage result={result} />;
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
