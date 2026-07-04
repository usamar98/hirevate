import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export const adminHirevateCookieName = "hirevate_adminhirevate01_session";
export const adminHirevateCookieMaxAge = 60 * 60 * 8;

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) return false;

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAdminHirevateConfigured() {
  return Boolean(env.adminHirevatePassword);
}

export function verifyAdminHirevatePassword(password: string) {
  if (!env.adminHirevatePassword) return false;

  return safeEqual(hashValue(password), hashValue(env.adminHirevatePassword));
}

export function getAdminHirevateSessionToken() {
  if (!env.adminHirevatePassword) return "";

  return hashValue(`hirevate-adminhirevate01:${env.adminHirevatePassword}:${env.appUrl}`);
}

function shouldUseSecureCookies() {
  return process.env.NODE_ENV === "production" && env.appUrl.startsWith("https://");
}

export async function hasAdminHirevateSession() {
  const token = getAdminHirevateSessionToken();
  if (!token) return false;

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(adminHirevateCookieName)?.value;

  return Boolean(cookieValue && safeEqual(cookieValue, token));
}

export async function setAdminHirevateSession() {
  const cookieStore = await cookies();
  cookieStore.set(adminHirevateCookieName, getAdminHirevateSessionToken(), {
    httpOnly: true,
    maxAge: adminHirevateCookieMaxAge,
    path: "/adminhirevate01",
    sameSite: "lax",
    secure: shouldUseSecureCookies()
  });
}

export async function clearAdminHirevateSession() {
  const cookieStore = await cookies();
  cookieStore.set(adminHirevateCookieName, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/adminhirevate01",
    sameSite: "lax",
    secure: shouldUseSecureCookies()
  });
}
