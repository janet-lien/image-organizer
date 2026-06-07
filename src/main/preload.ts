import { contextBridge } from "electron";
import { APP_NAME } from "../shared/constants";

contextBridge.exposeInMainWorld("imageOrganizer", {
  appName: APP_NAME
});
