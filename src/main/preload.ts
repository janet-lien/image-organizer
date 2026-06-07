import { contextBridge, ipcRenderer } from "electron";
import type { AnalyzeRequest, AnalyzeResponse } from "../shared/ipcTypes";

contextBridge.exposeInMainWorld("xhsOrganizer", {
  analyze: (request: AnalyzeRequest): Promise<AnalyzeResponse> => ipcRenderer.invoke("analyze", request)
});
