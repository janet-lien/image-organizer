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
