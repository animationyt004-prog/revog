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

type AuthStatus = "loading" | "guest" | "authed";

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  /** Access token lives in memory only — never in localStorage. */
  accessToken: string | null;
  bootstrap: () => Promise<void>;
  /** `identifier` is an email address or a 10-digit Indian mobile. */
  requestOtp: (identifier: string) => Promise<OtpChannel>;
  verifyOtp: (identifier: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
}

async function post(path: string, body?: unknown): Promise<Response> {
  return fetch(`${API}${path}`, {
    method: "POST",
    credentials: "include", // carries the httpOnly refresh cookie
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string | string[] };
    return Array.isArray(data.message) ? data.message[0] : (data.message ?? fallback);
  } catch {
    return fallback;
  }
}

export const useAuth = create<AuthState>((set) => ({
  status: "loading",
  user: null,
  accessToken: null,

  /** On app load: try to resume the session via the refresh cookie. */
  bootstrap: async () => {
    try {
      const res = await post("/auth/refresh");
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { accessToken: string; user: AuthUser };
      set({ status: "authed", user: data.user, accessToken: data.accessToken });
    } catch {
      set({ status: "guest", user: null, accessToken: null });
    }
  },

  requestOtp: async (identifier) => {
    const res = await post("/auth/request-otp", { identifier });
    if (!res.ok) throw new Error(await errorMessage(res, "Could not send OTP."));
    const data = (await res.json()) as { channel?: OtpChannel };
    return data.channel ?? "email";
  },

  verifyOtp: async (identifier, code) => {
    const res = await post("/auth/verify-otp", { identifier, code });
    if (!res.ok) throw new Error(await errorMessage(res, "Incorrect OTP."));
    const data = (await res.json()) as { accessToken: string; user: AuthUser };
    set({ status: "authed", user: data.user, accessToken: data.accessToken });
  },

  logout: async () => {
    await post("/auth/logout").catch(() => undefined);
    set({ status: "guest", user: null, accessToken: null });
  },
}));

/** Fetch an authenticated API route, transparently refreshing an expired
 *  access token once before giving up. */
export async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
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
