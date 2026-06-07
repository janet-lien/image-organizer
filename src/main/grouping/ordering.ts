import type { ImageAsset, ImageRole } from "../../shared/types";

const roleRank: Record<ImageRole, number> = {
  wide_scene: 10,
  main_subject: 20,
  angle: 30,
  detail: 40,
  function_material: 45,
  comparison: 50,
  full_set: 60
};

export function orderAssetsForPublishing(assets: ImageAsset[], coverAssetId: string): ImageAsset[] {
  const cover = assets.find((asset) => asset.id === coverAssetId);
  const rest = assets
    .filter((asset) => asset.id !== coverAssetId)
    .sort((a, b) => bestRoleRank(a) - bestRoleRank(b) || a.createdAtMs - b.createdAtMs);

  return cover ? [cover, ...rest] : rest;
}

function bestRoleRank(asset: ImageAsset): number {
  if (asset.labels.roles.length === 0) {
    return 99;
  }

  return Math.min(...asset.labels.roles.map((role) => roleRank[role]));
}
