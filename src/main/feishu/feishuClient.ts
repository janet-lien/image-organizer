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
    form.set("file", new Blob([new Uint8Array(file)]), basename(filePath));

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
    if (!fileToken) {
      throw new Error("Feishu media upload did not return file_token");
    }
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
