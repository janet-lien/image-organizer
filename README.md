# 小红书图片整理工具

首版为静态模式，支持 HEIC、JPG、JPEG、PNG 图片。

## Development

```bash
npm install
npm test
npm run dev
```

## Vision Analysis

Set `OPENAI_API_KEY` to use the OpenAI vision analyzer. Without it, the app uses deterministic mock labels for offline development.

Optional: set `OPENAI_VISION_MODEL` to override the default vision model.

## Workflow

1. Select source and output folders.
2. Choose grouping strategy and target image count.
3. Review estimated time and cost.
4. Analyze static images.
5. Review groups and choose one cover per folder.
6. Copy output.
7. Upload to Feishu Bitable when configured.

## Feishu Upload

Before previewing matches, fill in:

- Tenant Access Token
- App Token
- Table ID
- View ID
- Image field name
- Title field name
