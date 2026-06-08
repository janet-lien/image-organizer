import { join } from "node:path";

export function resolvePreloadPath(mainBundleDir: string): string {
  return join(mainBundleDir, "../preload/index.mjs");
}
