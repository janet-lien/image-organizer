import { describe, expect, it } from "vitest";
import { APP_NAME } from "../../src/shared/constants";

describe("project scaffold", () => {
  it("exposes the app name", () => {
    expect(APP_NAME).toBe("小红书图片整理");
  });
});
