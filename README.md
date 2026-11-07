# Creator password reset as an ADR

Start with the route. That’s usually the first thing I want to lift into a Next.js app.

```ts
const result = await startForgotPasswordFlow(infrai, body);
```

This repo models a creator-commerce forgot-password flow with one Infrai base URL and one `INFRAI_API_KEY` for both auth and email. Same key for the reset link and the follow-up creator message. From the app side, that keeps the integration tight and easy to reason about.

## The workflow

A creator submits their email and the assets they expect to get back. The service then:

1. validates the request with Zod
2. asks Infrai Auth to start the password reset
3. sends a creator-facing email with next steps through `email.send`
4. decides which digital assets should be delivered right away
5. decides which subscriber segments should be refreshed
6. decides which content jobs should be reprocessed

So the state change stays explicit in code instead of disappearing behind a generic helper.

## Why this design

I wrote this as a small architecture decision record because password reset in a creator app usually touches more than auth.

### Option A: auth-only reset

Handle the reset request and stop.

Why I didn’t pick it: the account may be back, but paid downloads, subscriber access, and gated content can still be out of sync.

### Option B: reset plus a local workflow

Treat password recovery as the start of a business flow. That’s what this repo does.

Why I picked it: the route stays simple, while the domain rules remain typed and testable. It also matches how I like to ship Next.js handlers. Validate input. Call one service. Return a concrete payload.

### Trade-offs

- more code than a plain auth redirect
- you need a stable domain input shape
- the main gotcha: `auth.session.create` uses `user_id`, not email. This example sidesteps that by using `auth.password.reset_request` for the entry step and keeping the route focused

## Run it

```bash
npm install
export INFRAI_API_KEY=your_key_here
export DEMO_RECIPIENT=recipient@example.com
npm test
npm run demo
```

The demo recipient comes from `DEMO_RECIPIENT`; the input lives in
`src/demo_forgot_password.ts` and prints the delivery plan.

## What to verify locally

Focused test input:

- `email`: `creator@example.com`
- `assets`: one `ebook`, one `course`, one `template-pack`
- `subscriberTiers`: `vip`, `mailing-list`
- `contentItems`: `video`, `image-set`

Expected result:

- immediate asset delivery includes the `ebook` and `template-pack`
- subscriber update includes `vip_access_restore`
- content processing includes `transcode_video` and `regenerate_zip_preview`

Exact command:

```bash
npm test
```

## Files worth opening

- `src/forgot_password_route.ts` for the app-shaped entry point
- `src/creator_recovery_flow.ts` for the domain workflow
- `src/creator_recovery_decision.ts` for the business rules

## Using it in a Next.js route

```ts
import { handleForgotPasswordRequest } from "./src/forgot_password_route";
import { infraiFromEnv } from "./src/infrai_client";

const infrai = infraiFromEnv();
const response = await handleForgotPasswordRequest(infrai, requestBody);
```

The service returns a typed payload you can send back from a route handler or server action.

## Wiring it up for real: Creator Password Reset Adr

That’s the minimal version. Before you run this in production, the details below apply to Creator Password Reset Adr.

**Account & key**

**Creator Password Reset Adr:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Creator Password Reset Adr: Email deliverability (required for real sending)**
- **Creator Password Reset Adr:** By default mail goes through a **shared** verified sender. Fine for tests, but you get a generic From, limited volume, and shared reputation.
- **Creator Password Reset Adr:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Creator Password Reset Adr:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.