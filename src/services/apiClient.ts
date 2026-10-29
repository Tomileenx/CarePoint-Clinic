import type { ApiErrorResponse } from "@/types/booking";
import { apiBaseUrl } from "./config";

export type ApiErrorKind =
  | "config"
  | "network"
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "conflict"
  | "rateLimited"
  | "server";

/** Safe, user-facing error. Never carries stack traces or raw server internals. */
export class ApiError extends Error {
  constructor(
    public kind: ApiErrorKind,
    message: string,
    public status?: number,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get retryable() {
    return this.kind === "network" || this.kind === "server" || this.kind === "rateLimited";
  }
}

export function errorFromStatus(status: number, body?: ApiErrorResponse): ApiError {
  switch (status) {
    case 400:
      return new ApiError(
        "validation",
        body?.message && body.message.length < 200
          ? body.message
          : "Some details were not accepted. Please check the form and try again.",
        status,
        body?.fieldErrors,
      );
    case 401:
      return new ApiError("unauthorized", "This request was not authorized.", status);
    case 403:
      return new ApiError("forbidden", "You are not permitted to perform this action.", status);
    case 404:
      return new ApiError("notFound", "We couldn't find what you were looking for.", status);
    case 409:
      return new ApiError(
        "conflict",
        "That slot is no longer available, or this request conflicts with an existing booking.",
        status,
      );
    case 429:
      return new ApiError(
        "rateLimited",
        "Too many requests. Please wait a moment before trying again.",
        status,
      );
    default:
      return new ApiError("server", "Something went wrong on our side. Please try again.", status);
  }
}

/**
 * Shared HTTP helper. Authentication (once the backend contract is decided) should be
 * added here only — e.g. via a server-side proxy — never with a key embedded in the bundle.
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T | undefined> {
  if (!apiBaseUrl) {
    throw new ApiError(
      "config",
      "The booking service is not configured. Set VITE_API_BASE_URL to the API address.",
    );
  }

  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError("network", "We couldn't reach the booking service. Check your connection and try again.");
  }

  if (!res.ok) {
    let body: ApiErrorResponse | undefined;
    try {
      body = (await res.json()) as ApiErrorResponse;
    } catch {
      body = undefined;
    }
    throw errorFromStatus(res.status, body);
  }

  if (res.status === 204) return undefined;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : undefined;
}
