// Runtime mode selection.
// VITE_API_MODE=mock (default) uses the isolated in-memory mock service.
// VITE_API_MODE=api calls the external API at VITE_API_BASE_URL.
// Never put private keys in VITE_ variables: they are shipped to the browser.

export type ApiMode = "mock" | "api";

export const apiMode: ApiMode = import.meta.env.VITE_API_MODE === "api" ? "api" : "mock";

export const apiBaseUrl: string | undefined =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") || undefined;

export const isMockMode = apiMode === "mock";
