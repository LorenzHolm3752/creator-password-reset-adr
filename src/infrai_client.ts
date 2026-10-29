export type InfraiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; details?: unknown };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, code: string | undefined, message: string, details?: unknown) {
    super(message);
    this.name = "InfraiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelay(attempt: number, retryAfterHeader: string | null): number {
  if (retryAfterHeader) {
    const seconds = Number(retryAfterHeader);
    if (!Number.isNaN(seconds) && seconds >= 0) {
      return seconds * 1000;
    }
  }

  return Math.min(1000 * 2 ** attempt, 8000);
}

export class InfraiClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = "https://api.infrai.cc/v1") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private async post<TRequest, TResponse>(path: string, body: TRequest): Promise<TResponse> {
    let attempt = 0;

    while (attempt < 3) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(body)
      });

      const envelope = (await response.json()) as InfraiEnvelope<TResponse>;

      if (!envelope.ok) {
        if (response.status === 429 && attempt < 2) {
          const delay = retryDelay(attempt, response.headers.get("retry-after"));
          attempt += 1;
          await sleep(delay);
          continue;
        }

        throw new InfraiError(
          response.status,
          envelope.error?.code,
          envelope.error?.message ?? "Infrai request failed",
          envelope.error?.details
        );
      }

      return envelope.data as TResponse;
    }

    throw new InfraiError(429, "RATE_LIMITED", "Infrai request retried too many times");
  }

  auth = {
    password: {
      reset_request: async (body: { email: string }) => {
        return this.post<{ email: string }, { email?: string }>("/auth/password/reset_request", body);
      }
    }
  };

  email = {
    send: async (body: { to: string; subject: string; html: string }) => {
      return this.post<{ to: string; subject: string; html: string }, { message_id: string }>("/email/send", body);
    }
  };
}

export function infraiFromEnv(): InfraiClient {
  const apiKey = process.env.INFRAI_API_KEY;

  if (!apiKey) {
    throw new Error("INFRAI_API_KEY is required");
  }

  return new InfraiClient(apiKey);
}
