import { env } from "@/env";

/**
 * Canonical app origin (no trailing slash).
 * Set once via NEXT_PUBLIC_APP_URL — change that env var to update every link.
 */
export function getAppBaseUrl(): string {
  return env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
}

/** Absolute URL for a path on this app, e.g. appUrl('/api/track/abc'). */
export function appUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getAppBaseUrl()}${normalized}`;
}

/**
 * Base URL for the current operation.
 * Production: always NEXT_PUBLIC_APP_URL.
 * Development: when handling an incoming request on localhost, uses the request
 * Host so manual sends match the dev server port (e.g. 3001 vs 3000).
 */
export function resolveAppBaseUrl(request?: Request): string {
  if (env.NODE_ENV !== "development" || !request) {
    return getAppBaseUrl();
  }

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) {
    return getAppBaseUrl();
  }

  const isLocal =
    host.startsWith("localhost") || host.startsWith("127.0.0.1");
  if (!isLocal) {
    return getAppBaseUrl();
  }

  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`.replace(/\/$/, "");
}

export function isLocalAppBaseUrl(baseUrl?: string): boolean {
  try {
    const { hostname } = new URL(baseUrl ?? getAppBaseUrl());
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export function warnIfLocalBaseUrlForOutboundEmail(baseUrl: string): void {
  if (!isLocalAppBaseUrl(baseUrl)) return;

  console.warn(
    "[Email] App base URL is localhost — mail clients load tracking images from their own servers and cannot reach localhost. For real open tracking in dev, set NEXT_PUBLIC_APP_URL to a public tunnel URL (e.g. ngrok) or test on your deployed app."
  );
}
