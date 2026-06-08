import { contextBridge, ipcRenderer } from "electron";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  ExportReviewedRequest,
  ExportReviewedResponse,
  PreviewFeishuMatchesRequest,
  PreviewFeishuMatchesResponse,
  SelectDirectoryRequest,
  SelectDirectoryResponse,
  UploadFeishuMatchesRequest,
  UploadFeishuMatchesResponse
} from "../shared/ipcTypes";

contextBridge.exposeInMainWorld("xhsOrganizer", {
  analyze: (request: AnalyzeRequest): Promise<AnalyzeResponse> => ipcRenderer.invoke("analyze", request),
  exportReviewed: (request: ExportReviewedRequest): Promise<ExportReviewedResponse> =>
    ipcRenderer.invoke("exportReviewed", request),
  previewFeishuMatches: (request: PreviewFeishuMatchesRequest): Promise<PreviewFeishuMatchesResponse> =>
    ipcRenderer.invoke("previewFeishuMatches", request),
  selectDirectory: (request: SelectDirectoryRequest): Promise<SelectDirectoryResponse> =>
    ipcRenderer.invoke("selectDirectory", request),
  uploadFeishuMatches: (request: UploadFeishuMatchesRequest): Promise<UploadFeishuMatchesResponse> =>
    ipcRenderer.invoke("uploadFeishuMatches", request)
});
