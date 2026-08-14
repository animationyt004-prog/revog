"use client";

import { create } from "zustand";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export interface AuthUser {
  id: string;
  /** Null when the account was created by SMS login and never gave an email. */
  email: string | null;
  phone: string | null;
  name: string | null;
  role: string;
}

/** Which channel the server sent the code over — drives the "check your
 *  inbox" vs "check your messages" copy on the OTP step. */
export type OtpChannel = "email" | "phone";

/** What the server can actually deliver on right now. SMS switches off with
 *  its provider key, so the form asks only for what will work. */
export async function fetchLoginChannels(): Promise<{
  email: boolean;
  sms: boolean;
}> {
  try {
    const res = await fetch(`${API}/auth/channels`, { credentials: "include" });
    if (!res.ok) throw new Error();
    return (await res.json()) as { email: boolean; sms: boolean };
  } catch {
    // Assume email-only rather than offering a channel that may not send.
    return { email: true, sms: false };
  }
}

type AuthStatus = "loading" | "guest" | "authed";

// Bootstrap runs in the background on every fresh page load. If an OTP login
// finishes while that older request is still in flight, its eventual 401 must
// not overwrite the newly authenticated state.
let authMutationVersion = 0;
let bootstrapPromise: Promise<void> | null = null;

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  /** Access token lives in memory only — never in localStorage. */
  accessToken: string | null;
  bootstrap: () => Promise<void>;
  /** `identifier` is an email address or a 10-digit Indian mobile. */
  requestOtp: (identifier: string) => Promise<OtpChannel>;
  verifyOtp: (identifier: string, code: string) => Promise<boolean>;
  updateProfile: (name: string) => Promise<void>;
  logout: () => Promise<void>;
}

async function post(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<Response> {
  return fetch(`${API}${path}`, {
    method: "POST",
    credentials: "include", // carries the httpOnly refresh cookie
    signal,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string | string[] };
    return Array.isArray(data.message)
      ? data.message[0]
      : (data.message ?? fallback);
  } catch {
    return fallback;
  }
}

export const useAuth = create<AuthState>((set) => ({
  status: "loading",
  user: null,
  accessToken: null,

  /** On app load: try to resume the session via the refresh cookie. */
  bootstrap: () => {
    // Refresh tokens rotate after every use. Sharing one in-flight request
    // prevents account widgets or repeated effects from submitting the same
    // token twice and invalidating an otherwise healthy session.
    if (bootstrapPromise) return bootstrapPromise;

    const run = async () => {
      const startedAtVersion = authMutationVersion;
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8_000);

      const raced = () => startedAtVersion !== authMutationVersion;

      try {
        const res = await post("/auth/refresh", undefined, controller.signal);
        if (!res.ok) throw new Error();
        const data = (await res.json()) as {
          accessToken: string;
          user: AuthUser;
        };
        if (raced()) return;
        if (!data.user || !data.accessToken) {
          set({ status: "guest", user: null, accessToken: null });
          return;
        }
        set({
          status: "authed",
          user: data.user,
          accessToken: data.accessToken,
        });
      } catch {
        if (!raced()) {
          set({ status: "guest", user: null, accessToken: null });
        }
      } finally {
        window.clearTimeout(timeout);
      }
    };

    bootstrapPromise = run().finally(() => {
      bootstrapPromise = null;
    });
    return bootstrapPromise;
  },

  requestOtp: async (identifier) => {
    const res = await post("/auth/request-otp", { identifier });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Could not send OTP."));
    const data = (await res.json()) as { channel?: OtpChannel };
    return data.channel ?? "email";
  },

  verifyOtp: async (identifier, code) => {
    const res = await post("/auth/verify-otp", { identifier, code });
    if (!res.ok) throw new Error(await errorMessage(res, "Incorrect OTP."));
    const data = (await res.json()) as {
      accessToken: string;
      user: AuthUser;
      isNewUser?: boolean;
    };
    authMutationVersion += 1;
    set({ status: "authed", user: data.user, accessToken: data.accessToken });
    return data.isNewUser === true;
  },

  updateProfile: async (name) => {
    const res = await authedFetch("/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok)
      throw new Error(await errorMessage(res, "Could not save your name."));
    const user = (await res.json()) as AuthUser;
    set({ user });
  },

  logout: async () => {
    await post("/auth/logout").catch(() => undefined);
    authMutationVersion += 1;
    set({ status: "guest", user: null, accessToken: null });
  },
}));

/** Fetch an authenticated API route, transparently refreshing an expired
 *  access token once before giving up. */
export async function authedFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const call = () =>
    fetch(`${API}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...init.headers,
        Authorization: `Bearer ${useAuth.getState().accessToken}`,
      },
    });

  let res = await call();
  if (res.status === 401 && useAuth.getState().status === "authed") {
    await useAuth.getState().bootstrap();
    if (useAuth.getState().status === "authed") res = await call();
  }
  return res;
}
