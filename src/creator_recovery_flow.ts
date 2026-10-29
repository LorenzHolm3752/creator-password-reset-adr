import { buildRecoveryPlan, type RecoveryPlan } from "./creator_recovery_decision.js";
import { forgotPasswordInputSchema, type ForgotPasswordInput } from "./creator_recovery_schema.js";
import type { InfraiClient } from "./infrai_client.js";

export type ForgotPasswordResult = {
  email: string;
  resetRequested: true;
  emailMessageId: string;
  plan: RecoveryPlan;
};

function renderRecoveryEmail(input: ForgotPasswordInput, plan: RecoveryPlan): string {
  const instantAssets = plan.deliverNow
    .filter((asset) => asset.deliveryMode === "instant-link")
    .map((asset) => `<li>${asset.title}</li>`)
    .join("");

  return `
    <h1>Password reset started</h1>
    <p>Hi ${input.creatorName},</p>
    <p>We started your password reset for ${input.email}. Use the reset link that was sent to this address.</p>
    <p>Storefront: <a href="${input.storefrontUrl}">${input.storefrontUrl}</a></p>
    <p>Assets ready right now:</p>
    <ul>${instantAssets || "<li>Your library will be restored after the reset finishes.</li>"}</ul>
  `;
}

export async function startForgotPasswordFlow(
  infrai: InfraiClient,
  rawInput: unknown
): Promise<ForgotPasswordResult> {
  const input = forgotPasswordInputSchema.parse(rawInput);
  const plan = buildRecoveryPlan(input);

  await infrai.auth.password.reset_request({ email: input.email });
  const emailResult = await infrai.email.send({
    to: input.email,
    subject: "Your creator account reset link",
    html: renderRecoveryEmail(input, plan)
  });

  return {
    email: input.email,
    resetRequested: true,
    emailMessageId: emailResult.message_id,
    plan
  };
}
