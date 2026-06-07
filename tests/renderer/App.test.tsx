import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { App } from "../../src/renderer/App";

describe("App", () => {
  it("renders the import entry point", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain("导入素材");
    expect(html).toContain("开始分析");
    expect(html).toContain('<button class="primary" type="button">开始分析</button>');
  });
});
