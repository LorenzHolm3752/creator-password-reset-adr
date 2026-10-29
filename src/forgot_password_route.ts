import { ZodError } from "zod";
import { InfraiError, type InfraiClient } from "./infrai_client.js";
import { startForgotPasswordFlow } from "./creator_recovery_flow.js";

export type RouteResponse = {
  status: number;
  body: Record<string, unknown>;
};

export async function handleForgotPasswordRequest(
  infrai: InfraiClient,
  requestBody: unknown
): Promise<RouteResponse> {
  try {
    const result = await startForgotPasswordFlow(infrai, requestBody);
    return {
      status: 200,
      body: result
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        status: 400,
        body: {
          error: "Invalid request body",
          issues: error.issues
        }
      };
    }

    if (error instanceof InfraiError) {
      return {
        status: error.status >= 400 && error.status < 500 ? error.status : 502,
        body: {
          error: error.message,
          code: error.code
        }
      };
    }

    return {
      status: 500,
      body: {
        error: "Unexpected error"
      }
    };
  }
}
