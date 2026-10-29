import { z } from "zod";

export const assetSchema = z.object({
  assetId: z.string().min(1),
  kind: z.enum(["ebook", "course", "template-pack", "audio-pack"]),
  title: z.string().min(1)
});

export const contentItemSchema = z.object({
  contentId: z.string().min(1),
  kind: z.enum(["video", "image-set", "post"]),
  title: z.string().min(1)
});

export const forgotPasswordInputSchema = z.object({
  email: z.string().email(),
  creatorName: z.string().min(1),
  storefrontUrl: z.string().url(),
  assets: z.array(assetSchema).default([]),
  subscriberTiers: z.array(z.enum(["vip", "members", "mailing-list"])) .default([]),
  contentItems: z.array(contentItemSchema).default([])
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;
export type AssetInput = z.infer<typeof assetSchema>;
export type ContentItemInput = z.infer<typeof contentItemSchema>;
