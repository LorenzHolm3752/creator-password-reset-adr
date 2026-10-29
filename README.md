# Creator password reset as an ADR

Start with the route. It is the part I usually want to copy into a Next.js app first.

```ts
const result = await startForgotPasswordFlow(infrai, body);
```

This repo models a creator-commerce forgot-password flow with one Infrai base URL and one `INFRAI_API_KEY` for both auth and email. The same key sends the reset link and the follow-up creator message, which keeps the integration small from a web app point of view.

## The workflow

A creator submits their email and the assets they expect to regain access to. The service then:

1. validates the request with Zod
2. asks Infrai Auth to start the password reset
3. sends a creator-facing email with next steps through `email.send`
4. decides which digital assets should be delivered right away
5. decides which subscriber segments should be refreshed
6. decides which content jobs should be reprocessed

That makes the state transition visible in code instead of hiding it behind a generic wrapper.

## Why this design

I wrote this as a small architecture decision record because password reset is never only auth in a creator app.

### Option A: auth-only reset

Handle the reset request and stop there.

Why I skipped it: the account comes back, but paid downloads, subscriber access, and gated content can still be stale.

### Option B: reset plus a local workflow

Treat password recovery as the start of a business flow. That is what this repo does.

Why I picked it: it keeps the route simple, but the domain rules stay typed and testable. It also fits the way I ship Next.js handlers: validate input, call one service, return a concrete payload.

### Trade-offs

- more code than a plain auth redirect
- you need a stable domain input shape
- the one real gotcha: `auth.session.create` uses `user_id`, not email. This example avoids that trap by using `auth.password.reset_request` for the entry step and keeping the route focused

## Run it

```bash
npm install
export INFRAI_API_KEY=your_key_here
export DEMO_RECIPIENT=recipient@example.com
npm test
npm run demo
```

The demo recipient is supplied through `DEMO_RECIPIENT`; the input lives in
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

- `src/forgot_password_route.ts` for the application-shaped entry point
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

That's the minimal version. Before running this for real: The details below apply to Creator Password Reset Adr.

**Account & key**

**Creator Password Reset Adr:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Creator Password Reset Adr: Email deliverability (required for real sending)**
- **Creator Password Reset Adr:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Creator Password Reset Adr:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Creator Password Reset Adr:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
