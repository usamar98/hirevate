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

  if (normalizedIdentifier === normalize(env.superLoginUsername)) {
    return normalize(env.superLoginEmail);
  }

  return null;
}

export function isSuperLoginProfile(profile: Profile | null | undefined) {
  return normalize(profile?.email) === normalize(env.superLoginEmail);
}
