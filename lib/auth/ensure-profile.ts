import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ProfileGeo = {
  countryCode?: string | null;
  countryName?: string | null;
};

function metadataText(user: User, key: string) {
  const value = user.user_metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function ensureUserProfile(user: User, geo: ProfileGeo = {}) {
  const admin = createSupabaseAdminClient();
  if (!admin) return false;

  const fullName = metadataText(user, "full_name");
  const countryCode = geo.countryCode ?? metadataText(user, "country_code");
  const countryName = geo.countryName ?? metadataText(user, "country_name");
  const lastSeenAt = new Date().toISOString();

  const { error: insertError } = await admin.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name: fullName,
      country_code: countryCode,
      country_name: countryName,
      last_seen_at: lastSeenAt
    },
    {
      ignoreDuplicates: true,
      onConflict: "id"
    }
  );

  if (insertError) throw insertError;

  const updates: {
    country_code?: string | null;
    country_name?: string | null;
    email?: string | null;
    full_name?: string | null;
    last_seen_at: string;
  } = {
    last_seen_at: lastSeenAt
  };

  if (user.email) updates.email = user.email;
  if (fullName) updates.full_name = fullName;
  if (countryCode) updates.country_code = countryCode;
  if (countryName) updates.country_name = countryName;

  const { error: updateError } = await admin.from("profiles").update(updates).eq("id", user.id);
  if (updateError) throw updateError;

  return true;
}
