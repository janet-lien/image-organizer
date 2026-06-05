# Xiaohongshu Static Image Organizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a macOS-first desktop tool that organizes static Xiaohongshu ecommerce photos into reviewable note folders, copies confirmed output, and optionally uploads each folder to an existing Feishu Bitable image field.

**Architecture:** Use Electron for the desktop shell, React for the local UI, and TypeScript for shared types across main, preload, and renderer. Keep domain logic in focused main-process modules with unit tests: scanning, thumbnailing, quality checks, AI analysis, grouping, exporting, and Feishu upload. UI talks to main process through a typed IPC bridge.

**Tech Stack:** Electron, Vite, React, TypeScript, Vitest, Testing Library, Node `fs/promises`, macOS `sips` for HEIC thumbnails, `sharp` for thumbnail quality metrics, OpenAI Responses API for vision, Feishu Open Platform HTTP APIs.

---

## Scope Check

The approved spec includes one integrated workflow with several modules: desktop UI, static image analysis, grouping, copy export, and Feishu upload. The implementation should proceed in vertical slices, but each module must remain independently testable. Live Photo MOV handling, video assets, title/body/topic generation, and multi-account Feishu management are out of scope for this plan.

## File Structure

Create the project around these boundaries:

```text
package.json
tsconfig.json
vite.config.ts
vitest.config.ts
electron.vite.config.ts
src/
  shared/
    types.ts                 Shared domain models and IPC contracts.
    constants.ts             Supported formats, default budgets, role order.
  main/
    main.ts                  Electron app bootstrap.
    preload.ts               Safe renderer bridge.
    ipc.ts                   Typed IPC handlers.
    config/
      appConfig.ts           Local settings, API keys, Feishu config loading.
    files/
      fileScanner.ts         Static image discovery and metadata.
      fileHasher.ts          Stable IDs and duplicate hashes.
    media/
      thumbnailService.ts    HEIC/JPG/PNG thumbnail generation.
      qualityService.ts      Blur/exposure/duplicate quality labels.
    vision/
      costEstimator.ts       Token/cost estimates before online analysis.
      visionAnalyzer.ts      Interface and OpenAI implementation.
      mockVisionAnalyzer.ts  Deterministic analyzer for tests and offline dev.
    grouping/
      groupingEngine.ts      Strategy-based note folder suggestions.
      ordering.ts            In-folder publishing order.
    review/
      reviewState.ts         User edits: cover, drag/drop, reuse, low quality.
    export/
      exporter.ts            Copy output and ordered filenames.
    feishu/
      feishuClient.ts        Feishu token, records, attachments, updates.
      feishuMapper.ts        Folder-to-record matching.
  renderer/
    App.tsx
    main.tsx
    styles.css
    pages/
      ImportPage.tsx
      AnalysisPage.tsx
      ReviewPage.tsx
      ExportPage.tsx
      FeishuUploadPage.tsx
      SettingsPage.tsx
    components/
      FolderCard.tsx
      ImageTile.tsx
      CostTimeEstimate.tsx
      FeishuMatchTable.tsx
tests/
  main/
    files/
    media/
    vision/
    grouping/
    review/
    export/
    feishu/
  renderer/
```

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `electron.vite.config.ts`
- Create: `src/main/main.ts`
- Create: `src/main/preload.ts`
- Create: `src/renderer/main.tsx`
- Create: `src/renderer/App.tsx`
- Create: `src/renderer/styles.css`
- Create: `tests/main/smoke.test.ts`

- [ ] **Step 1: Write the failing smoke test**

```ts
// tests/main/smoke.test.ts
import { describe, expect, it } from "vitest";
import { APP_NAME } from "../../src/shared/constants";

describe("project scaffold", () => {
  it("exposes the app name", () => {
    expect(APP_NAME).toBe("小红书图片整理");
  });
});
```

- [ ] **Step 2: Add shared constants**

```ts
// src/shared/constants.ts
export const APP_NAME = "小红书图片整理";

export const SUPPORTED_IMAGE_EXTENSIONS = [".heic", ".jpg", ".jpeg", ".png"] as const;

export const DEFAULT_BATCH_BUDGET_CNY = 10;
```

- [ ] **Step 3: Add package scripts and configs**

```json
{
  "name": "xiaohongshu-static-image-organizer",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "tsc --noEmit && electron-vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@electron-toolkit/preload": "^3.0.1",
    "@electron-toolkit/utils": "^3.0.0",
    "electron": "^31.7.7",
    "electron-vite": "^2.3.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "sharp": "^0.33.5"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.1",
    "@types/node": "^22.5.4",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.4",
    "vite": "^5.4.2",
    "vitest": "^2.0.5"
  }
}
```

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"]
  }
});
```

- [ ] **Step 4: Run the smoke test**

Run: `npm install`

Expected: creates `package-lock.json` and installs Electron, React, TypeScript, Vitest, and Sharp.

Run: `npm test -- tests/main/smoke.test.ts`

Expected before constants exist: FAIL with an import error.

Expected after constants exist: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts vitest.config.ts electron.vite.config.ts src tests
git commit -m "chore: scaffold desktop app"
```

## Task 2: Shared Domain Types

**Files:**
- Modify: `src/shared/types.ts`
- Create: `tests/main/shared/types.test.ts`

- [ ] **Step 1: Write shared type construction tests**

```ts
// tests/main/shared/types.test.ts
import { describe, expect, it } from "vitest";
import type { ImageAsset, NoteFolderDraft } from "../../../src/shared/types";

describe("shared domain types", () => {
  it("represents an image asset and a note folder draft", () => {
    const asset: ImageAsset = {
      id: "sha256:abc",
      sourcePath: "/photos/IMG_0001.HEIC",
      originalName: "IMG_0001.HEIC",
      extension: ".heic",
      createdAtMs: 1710000000000,
      width: 3024,
      height: 4032,
      hash: "abc",
      thumbnailPath: "/cache/abc.jpg",
      labels: {
        scene: "办公桌",
        productVariant: "款式A",
        roles: ["main_subject"],
        quality: []
      }
    };

    const folder: NoteFolderDraft = {
      id: "folder-01",
      index: 1,
      title: "01",
      strategy: "by_variant",
      targetCount: { min: 5, max: 8 },
      assetIds: [asset.id],
      backupAssetIds: [],
      lowQualityAssetIds: [],
      reusedAssetIds: [],
      coverAssetId: asset.id
    };

    expect(folder.assetIds).toEqual(["sha256:abc"]);
  });
});
```

- [ ] **Step 2: Define domain types**

```ts
// src/shared/types.ts
export type SupportedImageExtension = ".heic" | ".jpg" | ".jpeg" | ".png";

export type GroupingStrategy = "by_scene" | "by_variant" | "scene_best" | "custom";

export type ImageRole =
  | "wide_scene"
  | "main_subject"
  | "angle"
  | "detail"
  | "function_material"
  | "comparison"
  | "full_set";

export type QualityIssue =
  | "blurred"
  | "overexposed"
  | "underexposed"
  | "low_resolution"
  | "duplicate"
  | "weak_composition"
  | "occluded_subject";

export interface ImageLabels {
  scene?: string;
  productVariant?: string;
  roles: ImageRole[];
  quality: QualityIssue[];
  confidence?: number;
  explanation?: string;
}

export interface ImageAsset {
  id: string;
  sourcePath: string;
  originalName: string;
  extension: SupportedImageExtension;
  createdAtMs: number;
  width?: number;
  height?: number;
  hash: string;
  thumbnailPath?: string;
  labels: ImageLabels;
}

export interface TargetCount {
  min: number;
  max: number;
}

export interface NoteFolderDraft {
  id: string;
  index: number;
  title: string;
  strategy: GroupingStrategy;
  targetCount: TargetCount;
  assetIds: string[];
  backupAssetIds: string[];
  lowQualityAssetIds: string[];
  reusedAssetIds: string[];
  coverAssetId?: string;
}

export interface BatchEstimate {
  imageCount: number;
  estimatedCostCny: { min: number; max: number };
  estimatedAnalysisMinutes: { min: number; max: number };
  requiresBudgetConfirmation: boolean;
}
```

- [ ] **Step 3: Run the type tests**

Run: `npm test -- tests/main/shared/types.test.ts`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/shared/types.ts tests/main/shared/types.test.ts
git commit -m "feat: define image organizer domain types"
```

## Task 3: Static Image Scanner

**Files:**
- Create: `src/main/files/fileHasher.ts`
- Create: `src/main/files/fileScanner.ts`
- Create: `tests/main/files/fileScanner.test.ts`

- [ ] **Step 1: Write scanner tests**

```ts
// tests/main/files/fileScanner.test.ts
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { scanImageDirectory } from "../../../src/main/files/fileScanner";

describe("scanImageDirectory", () => {
  it("keeps supported static images sorted by filename", async () => {
    const dir = await mkdtemp(join(tmpdir(), "xhs-scan-"));
    await writeFile(join(dir, "IMG_0002.HEIC"), "two");
    await writeFile(join(dir, "IMG_0001.jpg"), "one");
    await writeFile(join(dir, "clip.mov"), "movie");

    const result = await scanImageDirectory(dir);

    expect(result.map((asset) => asset.originalName)).toEqual(["IMG_0001.jpg", "IMG_0002.HEIC"]);
    expect(result.every((asset) => asset.hash.length === 64)).toBe(true);
  });
});
```

- [ ] **Step 2: Implement hasher**

```ts
// src/main/files/fileHasher.ts
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export async function hashFile(path: string): Promise<string> {
  const bytes = await readFile(path);
  return createHash("sha256").update(bytes).digest("hex");
}
```

- [ ] **Step 3: Implement scanner**

```ts
// src/main/files/fileScanner.ts
import { readdir, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import { SUPPORTED_IMAGE_EXTENSIONS } from "../../shared/constants";
import type { ImageAsset, SupportedImageExtension } from "../../shared/types";
import { hashFile } from "./fileHasher";

const supported = new Set<string>(SUPPORTED_IMAGE_EXTENSIONS);

export async function scanImageDirectory(dir: string): Promise<ImageAsset[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => supported.has(extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

  const assets: ImageAsset[] = [];
  for (const name of files) {
    const sourcePath = join(dir, name);
    const info = await stat(sourcePath);
    const hash = await hashFile(sourcePath);
    assets.push({
      id: `sha256:${hash}`,
      sourcePath,
      originalName: name,
      extension: extname(name).toLowerCase() as SupportedImageExtension,
      createdAtMs: info.birthtimeMs || info.mtimeMs,
      hash,
      labels: { roles: [], quality: [] }
    });
  }
  return assets;
}
```

- [ ] **Step 4: Run scanner tests**

Run: `npm test -- tests/main/files/fileScanner.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/files tests/main/files
git commit -m "feat: scan static image folders"
```

## Task 4: Thumbnail and Local Quality Pipeline

**Files:**
- Create: `src/main/media/thumbnailService.ts`
- Create: `src/main/media/qualityService.ts`
- Create: `tests/main/media/qualityService.test.ts`

- [ ] **Step 1: Write quality tests against generated thumbnails**

```ts
// tests/main/media/qualityService.test.ts
import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { inspectThumbnailQuality } from "../../../src/main/media/qualityService";

describe("inspectThumbnailQuality", () => {
  it("marks tiny dark images as low quality", async () => {
    const dir = await mkdtemp(join(tmpdir(), "xhs-quality-"));
    const file = join(dir, "dark.jpg");
    await sharp({
      create: {
        width: 120,
        height: 120,
        channels: 3,
        background: { r: 5, g: 5, b: 5 }
      }
    }).jpeg().toFile(file);

    const result = await inspectThumbnailQuality(file);

    expect(result).toContain("low_resolution");
    expect(result).toContain("underexposed");
  });
});
```

- [ ] **Step 2: Implement thumbnail quality checks**

```ts
// src/main/media/qualityService.ts
import sharp from "sharp";
import type { QualityIssue } from "../../shared/types";

export async function inspectThumbnailQuality(thumbnailPath: string): Promise<QualityIssue[]> {
  const image = sharp(thumbnailPath);
  const metadata = await image.metadata();
  const stats = await image.stats();
  const issues = new Set<QualityIssue>();

  if ((metadata.width ?? 0) < 300 || (metadata.height ?? 0) < 300) {
    issues.add("low_resolution");
  }

  const avg = stats.channels.slice(0, 3).reduce((sum, channel) => sum + channel.mean, 0) / 3;
  if (avg < 35) issues.add("underexposed");
  if (avg > 225) issues.add("overexposed");

  return [...issues];
}
```

- [ ] **Step 3: Implement macOS thumbnail generation**

```ts
// src/main/media/thumbnailService.ts
import { mkdir } from "node:fs/promises";
import { basename, join, parse } from "node:path";
import { spawn } from "node:child_process";

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
      if (code === 0) resolve();
      else reject(new Error(`sips failed with code ${code}: ${stderr}`));
    });
  });
}
```

- [ ] **Step 4: Run quality tests**

Run: `npm test -- tests/main/media/qualityService.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/media tests/main/media
git commit -m "feat: generate thumbnails and local quality labels"
```

## Task 5: Cost Estimator and Vision Analyzer Interface

**Files:**
- Create: `src/main/vision/costEstimator.ts`
- Create: `src/main/vision/visionAnalyzer.ts`
- Create: `src/main/vision/mockVisionAnalyzer.ts`
- Create: `tests/main/vision/costEstimator.test.ts`
- Create: `tests/main/vision/mockVisionAnalyzer.test.ts`

- [ ] **Step 1: Write estimator tests**

```ts
// tests/main/vision/costEstimator.test.ts
import { describe, expect, it } from "vitest";
import { estimateBatchAnalysis } from "../../../src/main/vision/costEstimator";

describe("estimateBatchAnalysis", () => {
  it("flags a batch above the configured budget", () => {
    const result = estimateBatchAnalysis({ imageCount: 800, budgetCny: 3 });
    expect(result.imageCount).toBe(800);
    expect(result.requiresBudgetConfirmation).toBe(true);
  });
});
```

- [ ] **Step 2: Implement estimator**

```ts
// src/main/vision/costEstimator.ts
import type { BatchEstimate } from "../../shared/types";

export function estimateBatchAnalysis(input: { imageCount: number; budgetCny: number }): BatchEstimate {
  const min = roundCny(input.imageCount * 0.004);
  const max = roundCny(input.imageCount * 0.012);
  return {
    imageCount: input.imageCount,
    estimatedCostCny: { min, max },
    estimatedAnalysisMinutes: {
      min: Math.max(1, Math.ceil(input.imageCount / 35)),
      max: Math.max(2, Math.ceil(input.imageCount / 12))
    },
    requiresBudgetConfirmation: max > input.budgetCny
  };
}

function roundCny(value: number): number {
  return Math.round(value * 100) / 100;
}
```

- [ ] **Step 3: Define analyzer interface and mock**

```ts
// src/main/vision/visionAnalyzer.ts
import type { ImageAsset, ImageLabels } from "../../shared/types";

export interface VisionAnalyzer {
  analyzeBatch(assets: ImageAsset[]): Promise<Record<string, ImageLabels>>;
}
```

```ts
// src/main/vision/mockVisionAnalyzer.ts
import type { ImageAsset, ImageLabels } from "../../shared/types";
import type { VisionAnalyzer } from "./visionAnalyzer";

export class MockVisionAnalyzer implements VisionAnalyzer {
  async analyzeBatch(assets: ImageAsset[]): Promise<Record<string, ImageLabels>> {
    return Object.fromEntries(
      assets.map((asset, index) => [
        asset.id,
        {
          scene: index < assets.length / 2 ? "办公桌" : "窗边",
          productVariant: `款式${(index % 3) + 1}`,
          roles: index % 5 === 0 ? ["full_set"] : ["main_subject"],
          quality: asset.labels.quality,
          confidence: 0.85,
          explanation: "Mock analysis for deterministic development"
        }
      ])
    );
  }
}
```

- [ ] **Step 4: Run vision tests**

Run: `npm test -- tests/main/vision`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/vision tests/main/vision
git commit -m "feat: estimate AI analysis cost"
```

## Task 6: Grouping Engine and Ordering

**Files:**
- Create: `src/main/grouping/ordering.ts`
- Create: `src/main/grouping/groupingEngine.ts`
- Create: `tests/main/grouping/groupingEngine.test.ts`
- Create: `tests/main/grouping/ordering.test.ts`

- [ ] **Step 1: Write grouping tests**

```ts
// tests/main/grouping/groupingEngine.test.ts
import { describe, expect, it } from "vitest";
import type { ImageAsset } from "../../../src/shared/types";
import { createFolderDrafts } from "../../../src/main/grouping/groupingEngine";

function asset(id: string, scene: string, variant: string): ImageAsset {
  return {
    id,
    sourcePath: `/photos/${id}.heic`,
    originalName: `${id}.heic`,
    extension: ".heic",
    createdAtMs: Number(id.replace(/\D/g, "")) || 1,
    hash: id,
    labels: { scene, productVariant: variant, roles: ["main_subject"], quality: [] }
  };
}

describe("createFolderDrafts", () => {
  it("groups by product variant for single-item notes", () => {
    const result = createFolderDrafts({
      assets: [asset("a1", "办公桌", "A"), asset("a2", "办公桌", "A"), asset("b1", "办公桌", "B")],
      strategy: "by_variant",
      targetCount: { min: 3, max: 5 }
    });

    expect(result.map((folder) => folder.assetIds)).toEqual([["a1", "a2"], ["b1"]]);
  });
});
```

- [ ] **Step 2: Implement ordering**

```ts
// src/main/grouping/ordering.ts
import type { ImageAsset, ImageRole } from "../../shared/types";

const roleRank: Record<ImageRole, number> = {
  wide_scene: 10,
  main_subject: 20,
  angle: 30,
  detail: 40,
  function_material: 45,
  comparison: 50,
  full_set: 60
};

export function orderAssetsForPublishing(assets: ImageAsset[], coverAssetId: string): ImageAsset[] {
  const cover = assets.find((asset) => asset.id === coverAssetId);
  const rest = assets
    .filter((asset) => asset.id !== coverAssetId)
    .sort((a, b) => bestRoleRank(a) - bestRoleRank(b) || a.createdAtMs - b.createdAtMs);
  return cover ? [cover, ...rest] : rest;
}

function bestRoleRank(asset: ImageAsset): number {
  if (asset.labels.roles.length === 0) return 99;
  return Math.min(...asset.labels.roles.map((role) => roleRank[role]));
}
```

- [ ] **Step 3: Implement grouping engine**

```ts
// src/main/grouping/groupingEngine.ts
import type { GroupingStrategy, ImageAsset, NoteFolderDraft, TargetCount } from "../../shared/types";

export function createFolderDrafts(input: {
  assets: ImageAsset[];
  strategy: GroupingStrategy;
  targetCount: TargetCount;
}): NoteFolderDraft[] {
  const usable = input.assets.filter((asset) => asset.labels.quality.length === 0);
  const lowQuality = input.assets.filter((asset) => asset.labels.quality.length > 0).map((asset) => asset.id);
  const groups = groupAssets(usable, input.strategy);

  return groups.map((assets, index) => ({
    id: `folder-${String(index + 1).padStart(2, "0")}`,
    index: index + 1,
    title: String(index + 1).padStart(2, "0"),
    strategy: input.strategy,
    targetCount: input.targetCount,
    assetIds: assets.slice(0, input.targetCount.max).map((asset) => asset.id),
    backupAssetIds: assets.slice(input.targetCount.max).map((asset) => asset.id),
    lowQualityAssetIds: index === 0 ? lowQuality : [],
    reusedAssetIds: []
  }));
}

function groupAssets(assets: ImageAsset[], strategy: GroupingStrategy): ImageAsset[][] {
  const key =
    strategy === "by_variant"
      ? (asset: ImageAsset) => asset.labels.productVariant || "未识别款式"
      : (asset: ImageAsset) => asset.labels.scene || "未识别场景";

  const map = new Map<string, ImageAsset[]>();
  for (const asset of assets) {
    const groupKey = key(asset);
    map.set(groupKey, [...(map.get(groupKey) ?? []), asset]);
  }
  return [...map.values()].map((group) => group.sort((a, b) => a.createdAtMs - b.createdAtMs));
}
```

- [ ] **Step 4: Run grouping tests**

Run: `npm test -- tests/main/grouping`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/grouping tests/main/grouping
git commit -m "feat: suggest note folder groups"
```

## Task 7: Review State, Cover Requirement, and Reuse Marking

**Files:**
- Create: `src/main/review/reviewState.ts`
- Create: `tests/main/review/reviewState.test.ts`

- [ ] **Step 1: Write review state tests**

```ts
// tests/main/review/reviewState.test.ts
import { describe, expect, it } from "vitest";
import { setCover, validateReadyForExport } from "../../../src/main/review/reviewState";
import type { NoteFolderDraft } from "../../../src/shared/types";

const folder: NoteFolderDraft = {
  id: "folder-01",
  index: 1,
  title: "01",
  strategy: "by_variant",
  targetCount: { min: 3, max: 5 },
  assetIds: ["a", "b"],
  backupAssetIds: [],
  lowQualityAssetIds: [],
  reusedAssetIds: []
};

describe("reviewState", () => {
  it("requires a user-selected cover before export", () => {
    expect(validateReadyForExport([folder])).toEqual({
      ready: false,
      missingCoverFolderIds: ["folder-01"]
    });
  });

  it("sets a cover only from formal assets", () => {
    const updated = setCover(folder, "b");
    expect(updated.coverAssetId).toBe("b");
  });
});
```

- [ ] **Step 2: Implement review state helpers**

```ts
// src/main/review/reviewState.ts
import type { NoteFolderDraft } from "../../shared/types";

export function setCover(folder: NoteFolderDraft, assetId: string): NoteFolderDraft {
  if (!folder.assetIds.includes(assetId)) {
    throw new Error(`Cover asset ${assetId} is not in folder ${folder.id}`);
  }
  return { ...folder, coverAssetId: assetId };
}

export function validateReadyForExport(folders: NoteFolderDraft[]): {
  ready: boolean;
  missingCoverFolderIds: string[];
} {
  const missingCoverFolderIds = folders
    .filter((folder) => folder.assetIds.length > 0 && !folder.coverAssetId)
    .map((folder) => folder.id);
  return { ready: missingCoverFolderIds.length === 0, missingCoverFolderIds };
}
```

- [ ] **Step 3: Run review tests**

Run: `npm test -- tests/main/review/reviewState.test.ts`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/main/review tests/main/review
git commit -m "feat: require manual cover selection"
```

## Task 8: Copy Exporter

**Files:**
- Create: `src/main/export/exporter.ts`
- Create: `tests/main/export/exporter.test.ts`

- [ ] **Step 1: Write exporter tests**

```ts
// tests/main/export/exporter.test.ts
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { exportReviewedFolders } from "../../../src/main/export/exporter";
import type { ImageAsset, NoteFolderDraft } from "../../../src/shared/types";

describe("exportReviewedFolders", () => {
  it("copies original files without mutating source names", async () => {
    const dir = await mkdtemp(join(tmpdir(), "xhs-export-"));
    const src = join(dir, "IMG_0001.HEIC");
    const out = join(dir, "out");
    await writeFile(src, "image");

    const asset: ImageAsset = {
      id: "a",
      sourcePath: src,
      originalName: "IMG_0001.HEIC",
      extension: ".heic",
      createdAtMs: 1,
      hash: "a",
      labels: { roles: ["main_subject"], quality: [] }
    };

    const folder: NoteFolderDraft = {
      id: "folder-01",
      index: 1,
      title: "01",
      strategy: "by_variant",
      targetCount: { min: 1, max: 3 },
      assetIds: ["a"],
      backupAssetIds: [],
      lowQualityAssetIds: [],
      reusedAssetIds: [],
      coverAssetId: "a"
    };

    const result = await exportReviewedFolders({ outputDir: out, assets: [asset], folders: [folder] });
    expect(result.copiedFiles[0].destinationPath.endsWith("01/01_封面.heic")).toBe(true);
    expect(await readFile(src, "utf8")).toBe("image");
  });
});
```

- [ ] **Step 2: Implement exporter**

```ts
// src/main/export/exporter.ts
import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { ImageAsset, NoteFolderDraft } from "../../shared/types";
import { orderAssetsForPublishing } from "../grouping/ordering";
import { validateReadyForExport } from "../review/reviewState";

export async function exportReviewedFolders(input: {
  outputDir: string;
  assets: ImageAsset[];
  folders: NoteFolderDraft[];
}): Promise<{ copiedFiles: Array<{ sourcePath: string; destinationPath: string }> }> {
  const validation = validateReadyForExport(input.folders);
  if (!validation.ready) {
    throw new Error(`Missing cover for folders: ${validation.missingCoverFolderIds.join(", ")}`);
  }

  const assetMap = new Map(input.assets.map((asset) => [asset.id, asset]));
  const copiedFiles: Array<{ sourcePath: string; destinationPath: string }> = [];

  for (const folder of input.folders) {
    const folderDir = join(input.outputDir, folder.title);
    await mkdir(folderDir, { recursive: true });
    const assets = folder.assetIds.map((id) => assetMap.get(id)).filter((asset): asset is ImageAsset => Boolean(asset));
    const ordered = orderAssetsForPublishing(assets, folder.coverAssetId!);

    for (const [index, asset] of ordered.entries()) {
      const label = index === 0 ? "封面" : roleLabel(asset);
      const destinationPath = join(folderDir, `${String(index + 1).padStart(2, "0")}_${label}${asset.extension}`);
      await copyFile(asset.sourcePath, destinationPath);
      copiedFiles.push({ sourcePath: asset.sourcePath, destinationPath });
    }
  }

  return { copiedFiles };
}

function roleLabel(asset: ImageAsset): string {
  const role = asset.labels.roles[0];
  if (role === "wide_scene") return "远景";
  if (role === "angle") return "角度";
  if (role === "detail") return "细节";
  if (role === "function_material") return "功能材质";
  if (role === "comparison") return "对比";
  if (role === "full_set") return "合照";
  return "主图";
}
```

- [ ] **Step 3: Run exporter tests**

Run: `npm test -- tests/main/export/exporter.test.ts`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/main/export tests/main/export
git commit -m "feat: copy reviewed folders"
```

## Task 9: Feishu Mapping and Upload Client

**Files:**
- Create: `src/main/feishu/feishuMapper.ts`
- Create: `src/main/feishu/feishuClient.ts`
- Create: `tests/main/feishu/feishuMapper.test.ts`

- [ ] **Step 1: Write Feishu mapper tests**

```ts
// tests/main/feishu/feishuMapper.test.ts
import { describe, expect, it } from "vitest";
import { composeAttachmentField, mapFoldersToRecords } from "../../../src/main/feishu/feishuMapper";

describe("mapFoldersToRecords", () => {
  it("matches only the first N folders and records", () => {
    const result = mapFoldersToRecords({
      folderTitles: ["01", "02", "03"],
      records: [
        { recordId: "rec1", title: "第一篇", imageCount: 0 },
        { recordId: "rec2", title: "第二篇", imageCount: 2 }
      ]
    });

    expect(result.matches).toEqual([
      { folderTitle: "01", recordId: "rec1", title: "第一篇", imageCount: 0, action: "upload" },
      { folderTitle: "02", recordId: "rec2", title: "第二篇", imageCount: 2, action: "choose" }
    ]);
    expect(result.skippedFolderCount).toBe(1);
    expect(result.skippedRecordCount).toBe(0);
  });

  it("composes replacement and append attachment fields", () => {
    expect(composeAttachmentField({ existingTokens: ["old"], uploadedTokens: ["new"], mode: "replace" })).toEqual([
      { file_token: "new" }
    ]);
    expect(composeAttachmentField({ existingTokens: ["old"], uploadedTokens: ["new"], mode: "append" })).toEqual([
      { file_token: "old" },
      { file_token: "new" }
    ]);
  });
});
```

- [ ] **Step 2: Implement Feishu mapper**

```ts
// src/main/feishu/feishuMapper.ts
export interface FeishuRecordSummary {
  recordId: string;
  title: string;
  bodyPreview?: string;
  imageCount: number;
}

export interface FeishuFolderRecordMatch {
  folderTitle: string;
  recordId: string;
  title: string;
  bodyPreview?: string;
  imageCount: number;
  action: "upload" | "choose";
}

export type FeishuUploadMode = "replace" | "append";

export interface FeishuAttachmentValue {
  file_token: string;
}

export function mapFoldersToRecords(input: {
  folderTitles: string[];
  records: FeishuRecordSummary[];
}): {
  matches: FeishuFolderRecordMatch[];
  skippedFolderCount: number;
  skippedRecordCount: number;
} {
  const count = Math.min(input.folderTitles.length, input.records.length);
  const matches = Array.from({ length: count }, (_, index) => {
    const record = input.records[index];
    return {
      folderTitle: input.folderTitles[index],
      recordId: record.recordId,
      title: record.title,
      bodyPreview: record.bodyPreview,
      imageCount: record.imageCount,
      action: record.imageCount === 0 ? "upload" : "choose"
    };
  });

  return {
    matches,
    skippedFolderCount: Math.max(0, input.folderTitles.length - count),
    skippedRecordCount: Math.max(0, input.records.length - count)
  };
}

export function composeAttachmentField(input: {
  existingTokens: string[];
  uploadedTokens: string[];
  mode: FeishuUploadMode;
}): FeishuAttachmentValue[] {
  const tokens = input.mode === "append" ? [...input.existingTokens, ...input.uploadedTokens] : input.uploadedTokens;
  return tokens.map((fileToken) => ({ file_token: fileToken }));
}
```

- [ ] **Step 3: Implement Feishu client API methods**

```ts
// src/main/feishu/feishuClient.ts
import { readFile, stat } from "node:fs/promises";
import { basename } from "node:path";
import { composeAttachmentField, type FeishuUploadMode } from "./feishuMapper";

export interface FeishuConfig {
  tenantAccessToken: string;
  appToken: string;
  tableId: string;
  viewId: string;
  imageFieldName: string;
  titleFieldName: string;
  bodyFieldName: string;
  uploadParentType: "bitable_image" | "bitable_file";
}

export class FeishuClient {
  constructor(private readonly config: FeishuConfig) {}

  async listRecordSummaries(): Promise<
    Array<{ recordId: string; title: string; bodyPreview?: string; imageCount: number; existingImageTokens: string[] }>
  > {
    const url = new URL(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${this.config.appToken}/tables/${this.config.tableId}/records`
    );
    url.searchParams.set("view_id", this.config.viewId);
    url.searchParams.set("page_size", "500");

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.config.tenantAccessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Feishu record list failed: ${response.status} ${await response.text()}`);
    }

    const json = (await response.json()) as {
      data?: {
        items?: Array<{ record_id: string; fields: Record<string, unknown> }>;
      };
    };

    return (json.data?.items ?? []).map((item) => {
      const imageValue = item.fields[this.config.imageFieldName];
      const imageTokens = Array.isArray(imageValue)
        ? imageValue
            .map((entry) => (typeof entry === "object" && entry ? (entry as { file_token?: unknown }).file_token : undefined))
            .filter((token): token is string => typeof token === "string")
        : [];

      return {
        recordId: item.record_id,
        title: String(item.fields[this.config.titleFieldName] ?? item.record_id),
        bodyPreview: String(item.fields[this.config.bodyFieldName] ?? "").slice(0, 80),
        imageCount: imageTokens.length,
        existingImageTokens: imageTokens
      };
    });
  }

  async uploadImage(filePath: string): Promise<string> {
    const file = await readFile(filePath);
    const fileInfo = await stat(filePath);
    const form = new FormData();
    form.set("file_name", basename(filePath));
    form.set("parent_type", this.config.uploadParentType);
    form.set("parent_node", this.config.appToken);
    form.set("size", String(fileInfo.size));
    form.set("file", new Blob([file]), basename(filePath));

    const response = await fetch("https://open.feishu.cn/open-apis/drive/v1/medias/upload_all", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.tenantAccessToken}`
      },
      body: form
    });

    if (!response.ok) {
      throw new Error(`Feishu media upload failed: ${response.status} ${await response.text()}`);
    }

    const json = (await response.json()) as { data?: { file_token?: string } };
    const fileToken = json.data?.file_token;
    if (!fileToken) throw new Error("Feishu media upload did not return file_token");
    return fileToken;
  }

  async updateRecordImages(input: {
    recordId: string;
    existingTokens: string[];
    uploadedTokens: string[];
    mode: FeishuUploadMode;
  }): Promise<void> {
    const body = {
      fields: {
        [this.config.imageFieldName]: composeAttachmentField(input)
      }
    };

    const response = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${this.config.appToken}/tables/${this.config.tableId}/records/${input.recordId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.config.tenantAccessToken}`,
          "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      throw new Error(`Feishu update failed: ${response.status} ${await response.text()}`);
    }
  }
}
```

- [ ] **Step 4: Run Feishu mapper tests**

Run: `npm test -- tests/main/feishu/feishuMapper.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/feishu tests/main/feishu
git commit -m "feat: map folders to Feishu records"
```

## Task 10: IPC Bridge and Main Workflow Service

**Files:**
- Create: `src/main/ipc.ts`
- Modify: `src/main/preload.ts`
- Create: `src/shared/ipcTypes.ts`
- Create: `tests/main/ipcTypes.test.ts`

- [ ] **Step 1: Write IPC contract test**

```ts
// tests/main/ipcTypes.test.ts
import { describe, expect, it } from "vitest";
import type { AnalyzeRequest } from "../../src/shared/ipcTypes";

describe("IPC contracts", () => {
  it("represents an analysis request", () => {
    const request: AnalyzeRequest = {
      sourceDir: "/photos",
      outputDir: "/out",
      strategy: "by_scene",
      targetCount: { min: 5, max: 8 },
      budgetCny: 10
    };
    expect(request.targetCount.max).toBe(8);
  });
});
```

- [ ] **Step 2: Define IPC types**

```ts
// src/shared/ipcTypes.ts
import type { BatchEstimate, GroupingStrategy, NoteFolderDraft, TargetCount } from "./types";

export interface AnalyzeRequest {
  sourceDir: string;
  outputDir: string;
  strategy: GroupingStrategy;
  targetCount: TargetCount;
  budgetCny: number;
}

export interface AnalyzeResponse {
  estimate: BatchEstimate;
  folders: NoteFolderDraft[];
}
```

- [ ] **Step 3: Expose preload API**

```ts
// src/main/preload.ts
import { contextBridge, ipcRenderer } from "electron";
import type { AnalyzeRequest, AnalyzeResponse } from "../shared/ipcTypes";

contextBridge.exposeInMainWorld("xhsOrganizer", {
  analyze: (request: AnalyzeRequest): Promise<AnalyzeResponse> => ipcRenderer.invoke("analyze", request)
});
```

- [ ] **Step 4: Register IPC handlers**

```ts
// src/main/ipc.ts
import { ipcMain } from "electron";
import type { AnalyzeRequest } from "../shared/ipcTypes";
import { scanImageDirectory } from "./files/fileScanner";
import { estimateBatchAnalysis } from "./vision/costEstimator";
import { MockVisionAnalyzer } from "./vision/mockVisionAnalyzer";
import { createFolderDrafts } from "./grouping/groupingEngine";

export function registerIpcHandlers(): void {
  ipcMain.handle("analyze", async (_event, request: AnalyzeRequest) => {
    const assets = await scanImageDirectory(request.sourceDir);
    const estimate = estimateBatchAnalysis({ imageCount: assets.length, budgetCny: request.budgetCny });
    const analyzer = new MockVisionAnalyzer();
    const labels = await analyzer.analyzeBatch(assets);
    const analyzed = assets.map((asset) => ({ ...asset, labels: labels[asset.id] ?? asset.labels }));
    const folders = createFolderDrafts({
      assets: analyzed,
      strategy: request.strategy,
      targetCount: request.targetCount
    });
    return { estimate, folders };
  });
}
```

- [ ] **Step 5: Run IPC contract tests**

Run: `npm test -- tests/main/ipcTypes.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/main/ipc.ts src/main/preload.ts src/shared/ipcTypes.ts tests/main/ipcTypes.test.ts
git commit -m "feat: connect analysis workflow through IPC"
```

## Task 11: Renderer Workflow UI

**Files:**
- Modify: `src/renderer/App.tsx`
- Create: `src/renderer/pages/ImportPage.tsx`
- Create: `src/renderer/pages/ReviewPage.tsx`
- Create: `src/renderer/components/CostTimeEstimate.tsx`
- Create: `src/renderer/components/FolderCard.tsx`
- Create: `tests/renderer/App.test.tsx`

- [ ] **Step 1: Write renderer smoke test**

```tsx
// tests/renderer/App.test.tsx
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../../src/renderer/App";

describe("App", () => {
  it("renders the import entry point", () => {
    render(<App />);
    expect(screen.getByText("导入素材")).toBeInTheDocument();
    expect(screen.getByText("开始分析")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement import page**

```tsx
// src/renderer/pages/ImportPage.tsx
export function ImportPage(): JSX.Element {
  return (
    <main className="page">
      <header className="toolbar">
        <h1>导入素材</h1>
      </header>
      <section className="panel">
        <label>源文件夹</label>
        <input placeholder="/Users/jen/Desktop/photos" />
        <label>输出文件夹</label>
        <input placeholder="/Users/jen/Desktop/output" />
        <label>成篇策略</label>
        <div className="segmented">
          <button>按场景成篇</button>
          <button>按款式成篇</button>
          <button>同场景精选</button>
          <button>自定义</button>
        </div>
        <label>目标张数</label>
        <input placeholder="5-8" />
        <button className="primary">开始分析</button>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Implement app shell**

```tsx
// src/renderer/App.tsx
import { ImportPage } from "./pages/ImportPage";
import "./styles.css";

export function App(): JSX.Element {
  return <ImportPage />;
}
```

- [ ] **Step 4: Add focused styles**

```css
/* src/renderer/styles.css */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #1f2933;
  background: #f6f7f9;
}

.page {
  padding: 24px;
}

.toolbar {
  margin-bottom: 16px;
}

.panel {
  display: grid;
  gap: 12px;
  max-width: 760px;
}

.segmented {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

button {
  border: 1px solid #c9d1dc;
  background: white;
  border-radius: 6px;
  padding: 8px 12px;
}

.primary {
  background: #1f6feb;
  color: white;
  border-color: #1f6feb;
}
```

- [ ] **Step 5: Run renderer test**

Run: `npm test -- tests/renderer/App.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/renderer tests/renderer
git commit -m "feat: add static organizer import UI"
```

## Task 12: OpenAI Vision Implementation

**Files:**
- Create: `src/main/vision/openaiVisionAnalyzer.ts`
- Create: `tests/main/vision/openaiVisionAnalyzer.test.ts`

- [ ] **Step 1: Write mocked OpenAI analyzer test**

```ts
// tests/main/vision/openaiVisionAnalyzer.test.ts
import { describe, expect, it } from "vitest";
import { buildVisionRequest, parseVisionLabels } from "../../../src/main/vision/openaiVisionAnalyzer";

describe("parseVisionLabels", () => {
  it("parses model JSON into image labels", () => {
    const labels = parseVisionLabels(`{
      "scene": "办公桌",
      "productVariant": "款式A",
      "roles": ["main_subject", "detail"],
      "quality": [],
      "confidence": 0.91,
      "explanation": "主体清晰"
    }`);
    expect(labels.roles).toEqual(["main_subject", "detail"]);
    expect(labels.scene).toBe("办公桌");
  });

  it("builds a low-detail image request", () => {
    const request = buildVisionRequest({
      model: "gpt-5-mini",
      dataUrl: "data:image/jpeg;base64,abc",
      filename: "IMG_0001.jpg"
    });

    expect(request.input[0].content[1]).toEqual({
      type: "input_image",
      image_url: "data:image/jpeg;base64,abc",
      detail: "low"
    });
  });
});
```

- [ ] **Step 2: Implement parser and analyzer**

```ts
// src/main/vision/openaiVisionAnalyzer.ts
import { readFile } from "node:fs/promises";
import type { ImageAsset, ImageLabels, ImageRole, QualityIssue } from "../../shared/types";
import type { VisionAnalyzer } from "./visionAnalyzer";

const imageRoles: ImageRole[] = ["wide_scene", "main_subject", "angle", "detail", "function_material", "comparison", "full_set"];
const qualityIssues: QualityIssue[] = ["blurred", "overexposed", "underexposed", "low_resolution", "duplicate", "weak_composition", "occluded_subject"];

export function parseVisionLabels(raw: string): ImageLabels {
  const parsed = JSON.parse(raw) as Partial<ImageLabels>;
  return {
    scene: typeof parsed.scene === "string" ? parsed.scene : undefined,
    productVariant: typeof parsed.productVariant === "string" ? parsed.productVariant : undefined,
    roles: Array.isArray(parsed.roles) ? parsed.roles.filter((role): role is ImageRole => imageRoles.includes(role as ImageRole)) : [],
    quality: Array.isArray(parsed.quality)
      ? parsed.quality.filter((issue): issue is QualityIssue => qualityIssues.includes(issue as QualityIssue))
      : [],
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
    explanation: typeof parsed.explanation === "string" ? parsed.explanation : ""
  };
}

export function buildVisionRequest(input: { model: string; dataUrl: string; filename: string }) {
  return {
    model: input.model,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Analyze this Xiaohongshu ecommerce product photo. Return only JSON with keys: scene, productVariant, roles, quality, confidence, explanation. " +
              "Allowed roles: wide_scene, main_subject, angle, detail, function_material, comparison, full_set. " +
              "Allowed quality: blurred, overexposed, underexposed, low_resolution, duplicate, weak_composition, occluded_subject. " +
              `Filename: ${input.filename}`
          },
          {
            type: "input_image",
            image_url: input.dataUrl,
            detail: "low"
          }
        ]
      }
    ]
  };
}

export class OpenAIVisionAnalyzer implements VisionAnalyzer {
  constructor(
    private readonly apiKey: string,
    private readonly model = "gpt-5-mini"
  ) {}

  async analyzeBatch(assets: ImageAsset[]): Promise<Record<string, ImageLabels>> {
    if (!this.apiKey) throw new Error("OpenAI API key is missing");
    const entries: Array<[string, ImageLabels]> = [];

    for (const asset of assets) {
      if (!asset.thumbnailPath) {
        entries.push([asset.id, { ...asset.labels, confidence: 0, explanation: "Missing thumbnail" }]);
        continue;
      }

      const dataUrl = await toJpegDataUrl(asset.thumbnailPath);
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildVisionRequest({ model: this.model, dataUrl, filename: asset.originalName }))
      });

      if (!response.ok) {
        throw new Error(`OpenAI vision request failed: ${response.status} ${await response.text()}`);
      }

      const json = (await response.json()) as { output_text?: string };
      entries.push([asset.id, parseVisionLabels(json.output_text ?? "{}")]);
    }

    return Object.fromEntries(entries);
  }
}

async function toJpegDataUrl(path: string): Promise<string> {
  const bytes = await readFile(path);
  return `data:image/jpeg;base64,${bytes.toString("base64")}`;
}
```

- [ ] **Step 3: Run parser tests**

Run: `npm test -- tests/main/vision/openaiVisionAnalyzer.test.ts`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/main/vision/openaiVisionAnalyzer.ts tests/main/vision/openaiVisionAnalyzer.test.ts
git commit -m "feat: parse OpenAI vision labels"
```

## Task 13: End-to-End Local Verification

**Files:**
- Modify: `README.md`
- Create: `tests/main/workflow.test.ts`

- [ ] **Step 1: Write workflow test**

```ts
// tests/main/workflow.test.ts
import { mkdtemp, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { scanImageDirectory } from "../../src/main/files/fileScanner";
import { MockVisionAnalyzer } from "../../src/main/vision/mockVisionAnalyzer";
import { createFolderDrafts } from "../../src/main/grouping/groupingEngine";
import { setCover } from "../../src/main/review/reviewState";
import { exportReviewedFolders } from "../../src/main/export/exporter";

describe("static organizer local workflow", () => {
  it("scans, analyzes, groups, selects cover, and copies output", async () => {
    const dir = await mkdtemp(join(tmpdir(), "xhs-workflow-"));
    const out = join(dir, "out");
    await writeFile(join(dir, "IMG_0001.jpg"), "one");
    await writeFile(join(dir, "IMG_0002.jpg"), "two");

    const scanned = await scanImageDirectory(dir);
    const labels = await new MockVisionAnalyzer().analyzeBatch(scanned);
    const analyzed = scanned.map((asset) => ({ ...asset, labels: labels[asset.id] }));
    const [folder] = createFolderDrafts({
      assets: analyzed,
      strategy: "by_scene",
      targetCount: { min: 1, max: 8 }
    });
    const reviewed = setCover(folder, folder.assetIds[0]);

    await exportReviewedFolders({ outputDir: out, assets: analyzed, folders: [reviewed] });

    expect(await readdir(join(out, "01"))).toContain("01_封面.jpg");
  });
});
```

- [ ] **Step 2: Add README workflow**

```md
# 小红书图片整理工具

首版为静态模式，支持 HEIC、JPG、JPEG、PNG 图片。

## Development

```bash
npm install
npm test
npm run dev
```

## Workflow

1. Select source and output folders.
2. Choose grouping strategy and target image count.
3. Review estimated time and cost.
4. Analyze static images.
5. Review groups and choose one cover per folder.
6. Copy output.
7. Upload to Feishu Bitable when configured.
```

- [ ] **Step 3: Run full test suite**

Run: `npm test`

Expected: PASS.

- [ ] **Step 4: Run local app**

Run: `npm run dev`

Expected: Electron window opens and displays the import page.

- [ ] **Step 5: Commit**

```bash
git add README.md tests/main/workflow.test.ts
git commit -m "test: verify static organizer workflow"
```

## Task 14: Manual QA Checklist

**Files:**
- Create: `docs/qa/static-image-organizer-qa.md`

- [ ] **Step 1: Add QA checklist**

```md
# Static Image Organizer QA

## Import

- Select a folder with 10 JPG images.
- Confirm the image count appears.
- Select each strategy once.
- Confirm the estimate updates.

## Review

- Confirm every generated folder shows thumbnails.
- Move one image between folders.
- Move one image to low quality.
- Move one low-quality image back to a folder.
- Select one cover per folder.
- Confirm export is disabled before covers are selected.

## Export

- Export to an empty folder.
- Confirm original source names did not change.
- Confirm output files start with `01_封面`.

## Feishu

- Configure test Bitable tokens.
- Confirm first N folder-to-record matches display.
- For a record with existing images, choose skip.
- For a record without images, choose upload.
- Confirm failed uploads can be retried.
```

- [ ] **Step 2: Commit**

```bash
git add docs/qa/static-image-organizer-qa.md
git commit -m "docs: add static organizer QA checklist"
```

## Self-Review Checklist

- Spec coverage: This plan covers static import, estimates, AI interface, grouping, review, low-quality handling, cover selection, copy output, Feishu mapping, Feishu upload, and local verification.
- Scope control: Live Photo MOV handling, videos, generated text, and multi-account Feishu settings remain outside the implementation tasks.
- Type consistency: `ImageAsset`, `NoteFolderDraft`, `GroupingStrategy`, `TargetCount`, `ImageRole`, and `QualityIssue` are defined in Task 2 and used consistently.
- Testing path: Each domain module has a unit test, and Task 13 adds a local end-to-end workflow test.
