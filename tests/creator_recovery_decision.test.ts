import { describe, expect, it } from "vitest";
import { buildRecoveryPlan } from "../src/creator_recovery_decision.js";

describe("buildRecoveryPlan", () => {
  it("delivers simple digital assets now and schedules the right updates after password recovery", () => {
    const result = buildRecoveryPlan({
      email: "creator@example.com",
      creatorName: "Maya Lane",
      storefrontUrl: "https://storefront.example.com/maya",
      assets: [
        { assetId: "asset_ebook_1", kind: "ebook", title: "Weekly Prompt Pack" },
        { assetId: "asset_course_1", kind: "course", title: "Creator Launch Course" },
        { assetId: "asset_tpl_1", kind: "template-pack", title: "Media Kit Templates" }
      ],
      subscriberTiers: ["vip", "mailing-list"],
      contentItems: [
        { contentId: "content_vid_1", kind: "video", title: "Behind the Scenes" },
        { contentId: "content_img_1", kind: "image-set", title: "Press Photos" }
      ]
    });

    expect(result.deliverNow).toEqual([
      {
        assetId: "asset_ebook_1",
        title: "Weekly Prompt Pack",
        deliveryMode: "instant-link"
      },
      {
        assetId: "asset_course_1",
        title: "Creator Launch Course",
        deliveryMode: "restore-after-reset"
      },
      {
        assetId: "asset_tpl_1",
        title: "Media Kit Templates",
        deliveryMode: "instant-link"
      }
    ]);

    expect(result.updateSubscribers).toEqual([
      "vip_access_restore",
      "marketing_list_reconfirm"
    ]);

    expect(result.processContent).toEqual([
      "transcode_video",
      "regenerate_zip_preview"
    ]);
  });
});
