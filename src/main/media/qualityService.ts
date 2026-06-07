import sharp from "sharp";
import type { QualityIssue } from "../../shared/types";

export async function inspectThumbnailQuality(thumbnailPath: string): Promise<QualityIssue[]> {
  const image = sharp(thumbnailPath);
  const metadata = await image.metadata();
  const stats = await image.stats();
  const issues = new Set<QualityIssue>();

  if ((metadata.width ?? 0) < 300 || (metadata.height ?? 0) < 300) {
    issues.add("low_resolution");
  }

  const avg = stats.channels.slice(0, 3).reduce((sum, channel) => sum + channel.mean, 0) / 3;
  if (avg < 35) {
    issues.add("underexposed");
  }
  if (avg > 225) {
    issues.add("overexposed");
  }

  return [...issues];
}
