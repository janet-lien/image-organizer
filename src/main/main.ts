import { app, BrowserWindow } from "electron";
import { join } from "node:path";
import { APP_NAME } from "../shared/constants";
import { registerIpcHandlers } from "./ipc";
import { resolvePreloadPath } from "./preloadPath";

const createMainWindow = (): void => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: APP_NAME,
    webPreferences: {
      preload: resolvePreloadPath(__dirname),
      sandbox: false,
      contextIsolation: true
    }
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    return;
  }

  mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
};

app.whenReady().then(() => {
  registerIpcHandlers();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
