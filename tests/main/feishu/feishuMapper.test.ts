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
