import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE = "limoura_admin";

function getCredentials() {
  return {
    email: process.env.ADMIN_EMAIL ?? "admin@limoura.studio",
    password: process.env.ADMIN_PASSWORD ?? "changeme",
    secret: process.env.AUTH_SECRET ?? "dev-secret",
  };
}

// Tiny signed token: base64(email).base64(hmac(email))
async function sign(value: string, secret: string): Promise<string> {
  // Web Crypto subtle HMAC
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  const b = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${btoa(value)}.${b}`;
}

async function verify(token: string, secret: string): Promise<string | null> {
  if (!token || !token.includes(".")) return null;
  const [valueB64, sigB64] = token.split(".");
  if (!valueB64 || !sigB64) return null;
  try {
    const value = atob(valueB64);
    const expected = await sign(value, secret);
    return expected === token ? value : null;
  } catch {
    return null;
  }
}

export async function loginWithPassword(email: string, password: string) {
  const creds = getCredentials();
  if (email !== creds.email || password !== creds.password) return null;
  const token = await sign(email, creds.secret);
  return token;
}

export async function getCurrentUser(): Promise<{ email: string } | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;
  const value = await verify(token, getCredentials().secret);
  return value ? { email: value } : null;
}

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14, // 14 days
  });
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export const AUTH_COOKIE = COOKIE;
