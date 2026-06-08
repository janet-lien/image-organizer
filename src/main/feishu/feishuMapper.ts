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
  const matches: FeishuFolderRecordMatch[] = Array.from({ length: count }, (_, index) => {
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
