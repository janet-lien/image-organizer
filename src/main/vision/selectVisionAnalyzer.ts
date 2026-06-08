import type { VisionAnalyzer } from "./visionAnalyzer";
import { MockVisionAnalyzer } from "./mockVisionAnalyzer";
import { OpenAIVisionAnalyzer } from "./openaiVisionAnalyzer";

export function createDefaultVisionAnalyzer(env: NodeJS.ProcessEnv = process.env): VisionAnalyzer {
  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return new MockVisionAnalyzer();
  }

  const model = env.OPENAI_VISION_MODEL?.trim() || undefined;
  return new OpenAIVisionAnalyzer(apiKey, model);
}
