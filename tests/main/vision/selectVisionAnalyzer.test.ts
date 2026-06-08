import { describe, expect, it } from "vitest";
import { MockVisionAnalyzer } from "../../../src/main/vision/mockVisionAnalyzer";
import { OpenAIVisionAnalyzer } from "../../../src/main/vision/openaiVisionAnalyzer";
import { createDefaultVisionAnalyzer } from "../../../src/main/vision/selectVisionAnalyzer";

describe("createDefaultVisionAnalyzer", () => {
  it("uses OpenAI when an API key is configured", () => {
    expect(createDefaultVisionAnalyzer({ OPENAI_API_KEY: "sk-test" })).toBeInstanceOf(OpenAIVisionAnalyzer);
  });

  it("uses the mock analyzer for offline development", () => {
    expect(createDefaultVisionAnalyzer({})).toBeInstanceOf(MockVisionAnalyzer);
  });
});
