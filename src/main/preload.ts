import { contextBridge, ipcRenderer } from "electron";
import type { AnalyzeRequest, AnalyzeResponse, ExportReviewedRequest, ExportReviewedResponse } from "../shared/ipcTypes";

contextBridge.exposeInMainWorld("xhsOrganizer", {
  analyze: (request: AnalyzeRequest): Promise<AnalyzeResponse> => ipcRenderer.invoke("analyze", request),
  exportReviewed: (request: ExportReviewedRequest): Promise<ExportReviewedResponse> =>
    ipcRenderer.invoke("exportReviewed", request)
});
