import { startForgotPasswordFlow } from "./creator_recovery_flow.js";
import { infraiFromEnv } from "./infrai_client.js";

async function main(): Promise<void> {
  const infrai = infraiFromEnv();
  const recipient = process.env.DEMO_RECIPIENT;

  if (!recipient) {
    throw new Error("DEMO_RECIPIENT is required");
  }

  const result = await startForgotPasswordFlow(infrai, {
    email: recipient,
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

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
