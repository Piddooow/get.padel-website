"use client";

/**
 * Client-side session store.
 *
 * The header avatar and the booking widget read the visitor's session from
 * here instead of making the layout server-dynamic: one cached fetch serves
 * every consumer, and login/logout broadcast a refresh so the UI updates
 * instantly — no manual reload, no duplicate requests.
 */
import { useEffect, useSyncExternalStore } from "react";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  whatsapp?: string | null;
}

interface SessionState {
  user: SessionUser | null;
  loaded: boolean;
}

// Stable references: useSyncExternalStore requires an identical snapshot
// between calls, otherwise React warns and can loop.
const SERVER_SNAPSHOT: SessionState = { user: null, loaded: false };
let snapshot: SessionState = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): SessionState {
  return snapshot;
}

function getServerSnapshot(): SessionState {
  return SERVER_SNAPSHOT;
}

/** Fetches the session once; concurrent callers share the same request. */
export function refreshSession(): Promise<void> {
  if (inflight) return inflight;

  inflight = fetch("/api/auth/me", { cache: "no-store" })
    .then((response) => (response.ok ? response.json() : { user: null }))
    .then((data: { user?: SessionUser | null }) => {
      snapshot = { user: data?.user ?? null, loaded: true };
      listeners.forEach((listener) => listener());
    })
    .catch(() => {
      snapshot = { user: null, loaded: true };
      listeners.forEach((listener) => listener());
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/** Call after login, registration or logout for an immediate UI update. */
export function notifyAuthChanged(): void {
  void refreshSession();
}

export function useSession(): SessionState {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!state.loaded) void refreshSession();
  }, [state.loaded]);

  return state;
}
