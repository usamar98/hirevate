import { z } from "zod";
import { env } from "@/lib/env";
import type { Profile } from "@/types/database";

const emailSchema = z.string().trim().email();

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export function resolveLoginEmail(identifier: string) {
  const normalizedIdentifier = normalize(identifier);

  if (emailSchema.safeParse(normalizedIdentifier).success) {
    return normalizedIdentifier;
  }

  if (isSuperLoginIdentifier(identifier) && env.superLoginEmail) {
    return normalize(env.superLoginEmail);
  }

  return null;
}

export function isSuperLoginIdentifier(identifier: string) {
  return Boolean(env.superLoginUsername) && normalize(identifier) === normalize(env.superLoginUsername);
}

export function isValidSuperLoginPassword(password: string) {
  return Boolean(env.superLoginPassword) && password === env.superLoginPassword;
}

export function isSuperLoginProfile(profile: Profile | null | undefined) {
  return Boolean(env.superLoginEmail) && normalize(profile?.email) === normalize(env.superLoginEmail);
}
