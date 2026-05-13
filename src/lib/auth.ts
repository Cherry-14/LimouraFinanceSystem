import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "./db";

const COOKIE = "limoura_admin";
const SECRET = () => process.env.AUTH_SECRET ?? "dev-secret";

async function sign(value: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  const b = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${btoa(value)}.${b}`;
}

async function verify(token: string): Promise<string | null> {
  if (!token?.includes(".")) return null;
  const [valueB64, sigB64] = token.split(".");
  if (!valueB64 || !sigB64) return null;
  try {
    const value = atob(valueB64);
    const expected = await sign(value);
    return expected === token ? value : null;
  } catch {
    return null;
  }
}

export async function loginWithPassword(username: string, password: string): Promise<string | null> {
  const { data: user } = await db
    .from("User")
    .select("passwordHash")
    .eq("username", username)
    .single();
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  return sign(username);
}

export async function getCurrentUser(): Promise<{ username: string } | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;
  const value = await verify(token);
  return value ? { username: value } : null;
}

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export const AUTH_COOKIE = COOKIE;
