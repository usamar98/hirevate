"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearAdminHirevateSession,
  isAdminHirevateConfigured,
  setAdminHirevateSession,
  verifyAdminHirevatePassword
} from "@/lib/admin/password-session";

function redirectWithError(error: "invalid" | "not-configured") {
  redirect(`/adminhirevate01?error=${error}`);
}

export async function signInAdminHirevateAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (!isAdminHirevateConfigured()) {
    redirectWithError("not-configured");
  }

  if (!verifyAdminHirevatePassword(password)) {
    redirectWithError("invalid");
  }

  await setAdminHirevateSession();
  revalidatePath("/adminhirevate01");
  redirect("/adminhirevate01");
}

export async function signOutAdminHirevateAction() {
  await clearAdminHirevateSession();
  revalidatePath("/adminhirevate01");
  redirect("/adminhirevate01");
}