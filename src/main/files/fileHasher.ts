import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export async function hashFile(path: string): Promise<string> {
  const bytes = await readFile(path);
  return createHash("sha256").update(bytes).digest("hex");
}
