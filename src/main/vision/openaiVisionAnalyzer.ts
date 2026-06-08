import { readFile } from "node:fs/promises";
import type { ImageAsset, ImageLabels, ImageRole, QualityIssue } from "../../shared/types";
import type { VisionAnalyzer } from "./visionAnalyzer";

const imageRoles: ImageRole[] = [
  "wide_scene",
  "main_subject",
  "angle",
  "detail",
  "function_material",
  "comparison",
  "full_set"
];
const qualityIssues: QualityIssue[] = [
  "blurred",
  "overexposed",
  "underexposed",
  "low_resolution",
  "duplicate",
  "weak_composition",
  "occluded_subject"
];

export function parseVisionLabels(raw: string): ImageLabels {
  const parsed = JSON.parse(extractJsonObject(raw)) as Partial<ImageLabels>;
  return {
    scene: typeof parsed.scene === "string" ? parsed.scene : undefined,
    productVariant: typeof parsed.productVariant === "string" ? parsed.productVariant : undefined,
    roles: Array.isArray(parsed.roles)
      ? parsed.roles.filter((role): role is ImageRole => imageRoles.includes(role as ImageRole))
      : [],
    quality: Array.isArray(parsed.quality)
      ? parsed.quality.filter((issue): issue is QualityIssue => qualityIssues.includes(issue as QualityIssue))
      : [],
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
    explanation: typeof parsed.explanation === "string" ? parsed.explanation : ""
  };
}

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
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

export function extractResponseOutputText(responseJson: unknown): string {
  if (!responseJson || typeof responseJson !== "object") {
    return "";
  }

  const directText = (responseJson as { output_text?: unknown }).output_text;
  if (typeof directText === "string") {
    return directText;
  }

  const output = (responseJson as { output?: unknown }).output;
  if (!Array.isArray(output)) {
    return "";
  }

  return output
    .flatMap((item) => (isObject(item) && Array.isArray(item.content) ? item.content : []))
    .map((content) => {
      if (!isObject(content)) {
        return "";
      }
      const type = typeof content.type === "string" ? content.type : "";
      const text = typeof content.text === "string" ? content.text : "";
      return type === "output_text" || type === "text" ? text : "";
    })
    .filter(Boolean)
    .join("\n");
}

export class OpenAIVisionAnalyzer implements VisionAnalyzer {
  constructor(
    private readonly apiKey: string,
    private readonly model = "gpt-5-mini"
  ) {}

  async analyzeBatch(assets: ImageAsset[]): Promise<Record<string, ImageLabels>> {
    if (!this.apiKey) {
      throw new Error("OpenAI API key is missing");
    }

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

      const json = await response.json();
      entries.push([asset.id, parseVisionLabels(extractResponseOutputText(json) || "{}")]);
    }

    return Object.fromEntries(entries);
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

async function toJpegDataUrl(path: string): Promise<string> {
  const bytes = await readFile(path);
  return `data:image/jpeg;base64,${bytes.toString("base64")}`;
}
