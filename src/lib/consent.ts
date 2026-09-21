"use client";

/**
 * Cookie consent store (client-only).
 *
 * The choice lives in a first-party cookie so it survives reloads and can be
 * read without JavaScript on the server. Analytics (GA4 + the first-party
 * event sink) only runs when the visitor explicitly accepts.
 */
import { useSyncExternalStore } from "react";

export const CONSENT_COOKIE = "gp-cookie-consent";
export const CONSENT_EVENT = "gp-consent-change";

export type ConsentValue = "accepted" | "essential" | null;

let cache: ConsentValue | undefined;
const listeners = new Set<() => void>();

function readCookie(): ConsentValue {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
  const value = match?.split("=")[1];
  return value === "accepted" || value === "essential" ? value : null;
}

function getSnapshot(): ConsentValue {
  if (cache === undefined) cache = readCookie();
  return cache;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setConsent(value: Exclude<ConsentValue, null>): void {
  if (typeof document === "undefined") return;
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
  cache = value;
  listeners.forEach((listener) => listener());
}

/** Reactive consent value; `null` during SSR and until a choice is made. */
export function useConsent(): ConsentValue {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

/** Non-reactive read for event handlers. */
export function hasAnalyticsConsent(): boolean {
  return getSnapshot() === "accepted";
}
