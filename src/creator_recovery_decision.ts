import type { AssetInput, ContentItemInput, ForgotPasswordInput } from "./creator_recovery_schema.js";

export type DeliveryAsset = {
  assetId: string;
  title: string;
  deliveryMode: "instant-link" | "restore-after-reset";
};

export type SubscriberUpdate =
  | "vip_access_restore"
  | "member_digest_refresh"
  | "marketing_list_reconfirm";

export type ContentProcessingJob =
  | "transcode_video"
  | "regenerate_zip_preview"
  | "rebuild_post_index";

export type RecoveryPlan = {
  deliverNow: DeliveryAsset[];
  updateSubscribers: SubscriberUpdate[];
  processContent: ContentProcessingJob[];
};

function decideAssetDelivery(assets: AssetInput[]): DeliveryAsset[] {
  return assets.map((asset) => ({
    assetId: asset.assetId,
    title: asset.title,
    deliveryMode: asset.kind === "course" ? "restore-after-reset" : "instant-link"
  }));
}

function decideSubscriberUpdates(input: ForgotPasswordInput): SubscriberUpdate[] {
  const updates = new Set<SubscriberUpdate>();

  for (const tier of input.subscriberTiers) {
    if (tier === "vip") {
      updates.add("vip_access_restore");
    }

    if (tier === "members") {
      updates.add("member_digest_refresh");
    }

    if (tier === "mailing-list") {
      updates.add("marketing_list_reconfirm");
    }
  }

  return [...updates];
}

function decideContentJobs(items: ContentItemInput[]): ContentProcessingJob[] {
  const jobs = new Set<ContentProcessingJob>();

  for (const item of items) {
    if (item.kind === "video") {
      jobs.add("transcode_video");
    }

    if (item.kind === "image-set") {
      jobs.add("regenerate_zip_preview");
    }

    if (item.kind === "post") {
      jobs.add("rebuild_post_index");
    }
  }

  return [...jobs];
}

export function buildRecoveryPlan(input: ForgotPasswordInput): RecoveryPlan {
  return {
    deliverNow: decideAssetDelivery(input.assets),
    updateSubscribers: decideSubscriberUpdates(input),
    processContent: decideContentJobs(input.contentItems)
  };
}
