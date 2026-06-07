import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { basename, join, parse } from "node:path";

export async function createThumbnail(sourcePath: string, cacheDir: string): Promise<string> {
  await mkdir(cacheDir, { recursive: true });
  const outputPath = join(cacheDir, `${parse(basename(sourcePath)).name}.jpg`);
  await runSips(sourcePath, outputPath);
  return outputPath;
}

function runSips(sourcePath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("sips", ["-s", "format", "jpeg", "-Z", "1024", sourcePath, "--out", outputPath]);
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`sips failed with code ${code}: ${stderr}`));
      }
    });
  });
}
