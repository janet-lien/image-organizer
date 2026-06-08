import type { GroupingStrategy, ImageAsset, NoteFolderDraft, TargetCount } from "../../shared/types";

export function createFolderDrafts(input: {
  assets: ImageAsset[];
  strategy: GroupingStrategy;
  targetCount: TargetCount;
}): NoteFolderDraft[] {
  const usable = input.assets.filter((asset) => asset.labels.quality.length === 0);
  const lowQuality = input.assets.filter((asset) => asset.labels.quality.length > 0).map((asset) => asset.id);
  const groups = groupAssets(usable, input.strategy);
  const reviewGroups = groups.length > 0 || lowQuality.length === 0 ? groups : [[]];

  return reviewGroups.map((assets, index) => ({
    id: `folder-${String(index + 1).padStart(2, "0")}`,
    index: index + 1,
    title: String(index + 1).padStart(2, "0"),
    strategy: input.strategy,
    targetCount: input.targetCount,
    assetIds: assets.slice(0, input.targetCount.max).map((asset) => asset.id),
    backupAssetIds: assets.slice(input.targetCount.max).map((asset) => asset.id),
    lowQualityAssetIds: index === 0 ? lowQuality : [],
    reusedAssetIds: []
  }));
}

function groupAssets(assets: ImageAsset[], strategy: GroupingStrategy): ImageAsset[][] {
  const key =
    strategy === "by_variant"
      ? (asset: ImageAsset) => asset.labels.productVariant || "未识别款式"
      : (asset: ImageAsset) => asset.labels.scene || "未识别场景";

  const map = new Map<string, ImageAsset[]>();
  for (const asset of assets) {
    const groupKey = key(asset);
    map.set(groupKey, [...(map.get(groupKey) ?? []), asset]);
  }

  return [...map.values()].map((group) => group.sort((a, b) => a.createdAtMs - b.createdAtMs));
}
