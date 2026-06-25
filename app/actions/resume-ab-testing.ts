"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createResumeAbApplicationSchema,
  createResumeAbTestSchema,
  deleteResumeAbApplicationSchema,
  updateResumeAbApplicationStatusSchema
} from "@/lib/validators/resume-ab-testing";
import type { Database } from "@/types/database";

const dashboardPath = "/dashboard/resume-testing";

type ActionErrorCode =
  | "setup"
  | "not-configured"
  | "invalid-test"
  | "invalid-application"
  | "missing-test"
  | "save-failed"
  | "update-failed"
  | "delete-failed";

type ActionSuccessCode = "test-created" | "application-created" | "application-updated" | "application-deleted";

function readFormValue(formData: FormData, key: string) {
  return formData.get(key)?.toString() ?? "";
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function redirectWithError(code: ActionErrorCode): never {
  redirect(`${dashboardPath}?resumeTestError=${code}`);
}

function redirectWithSuccess(code: ActionSuccessCode): never {
  redirect(`${dashboardPath}?resumeTestSuccess=${code}`);
}

function isMissingResumeTestingSchema(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("could not find the table")
  );
}

function redirectForSupabaseError(
  error: { code?: string; message?: string } | null,
  fallback: ActionErrorCode
): never {
  console.error("Resume A/B action failed", error);
  if (isMissingResumeTestingSchema(error)) {
    redirectWithError("setup");
  }

  redirectWithError(fallback);
}

async function getAuthedSupabase() {
  const user = await requireUser(dashboardPath);
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirectWithError("not-configured");
  }

  return { supabase, user };
}

export async function createResumeAbTestAction(formData: FormData) {
  const parsed = createResumeAbTestSchema.safeParse({
    name: readFormValue(formData, "name"),
    resumeAName: readFormValue(formData, "resumeAName"),
    resumeANotes: readFormValue(formData, "resumeANotes"),
    resumeBName: readFormValue(formData, "resumeBName"),
    resumeBNotes: readFormValue(formData, "resumeBNotes")
  });

  if (!parsed.success) {
    redirectWithError("invalid-test");
  }

  const { supabase, user } = await getAuthedSupabase();
  const insert: Database["public"]["Tables"]["resume_ab_tests"]["Insert"] = {
    user_id: user.id,
    name: parsed.data.name,
    resume_a_name: parsed.data.resumeAName,
    resume_a_notes: parsed.data.resumeANotes,
    resume_b_name: parsed.data.resumeBName,
    resume_b_notes: parsed.data.resumeBNotes
  };

  const { error } = await supabase.from("resume_ab_tests").insert(insert);

  if (error) {
    redirectForSupabaseError(error, "save-failed");
  }

  revalidatePath(dashboardPath);
  redirectWithSuccess("test-created");
}

export async function createResumeAbApplicationAction(formData: FormData) {
  const parsed = createResumeAbApplicationSchema.safeParse({
    abTestId: readFormValue(formData, "abTestId"),
    resumeVariant: readFormValue(formData, "resumeVariant"),
    jobTitle: readFormValue(formData, "jobTitle"),
    company: readFormValue(formData, "company"),
    contactName: readFormValue(formData, "contactName"),
    contactEmail: readFormValue(formData, "contactEmail"),
    status: readFormValue(formData, "status") || "applied",
    applicationChannel: readFormValue(formData, "applicationChannel") || "direct",
    appliedAt: readFormValue(formData, "appliedAt") || todayIsoDate(),
    interviewAt: readFormValue(formData, "interviewAt"),
    nextFollowUpAt: readFormValue(formData, "nextFollowUpAt"),
    sourceUrl: readFormValue(formData, "sourceUrl"),
    resumeSnapshotUrl: readFormValue(formData, "resumeSnapshotUrl"),
    notes: readFormValue(formData, "notes")
  });

  if (!parsed.success) {
    redirectWithError("invalid-application");
  }

  const { supabase, user } = await getAuthedSupabase();
  const { data: test, error: testError } = await supabase
    .from("resume_ab_tests")
    .select("id")
    .eq("id", parsed.data.abTestId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (testError) {
    redirectForSupabaseError(testError, "save-failed");
  }

  if (!test) {
    redirectWithError("missing-test");
  }

  const interviewAt =
    parsed.data.interviewAt ??
    (parsed.data.status === "interview" || parsed.data.status === "offer" ? todayIsoDate() : null);

  const insert: Database["public"]["Tables"]["resume_ab_applications"]["Insert"] = {
    user_id: user.id,
    ab_test_id: parsed.data.abTestId,
    resume_variant: parsed.data.resumeVariant,
    job_title: parsed.data.jobTitle,
    company: parsed.data.company,
    contact_name: parsed.data.contactName,
    contact_email: parsed.data.contactEmail,
    status: parsed.data.status,
    application_channel: parsed.data.applicationChannel,
    applied_at: parsed.data.appliedAt,
    interview_at: interviewAt,
    next_follow_up_at: parsed.data.nextFollowUpAt,
    source_url: parsed.data.sourceUrl,
    resume_snapshot_url: parsed.data.resumeSnapshotUrl,
    notes: parsed.data.notes
  };

  const { error } = await supabase.from("resume_ab_applications").insert(insert);

  if (error) {
    redirectForSupabaseError(error, "save-failed");
  }

  revalidatePath(dashboardPath);
  redirectWithSuccess("application-created");
}

export async function updateResumeAbApplicationStatusAction(formData: FormData) {
  const parsed = updateResumeAbApplicationStatusSchema.safeParse({
    applicationId: readFormValue(formData, "applicationId"),
    status: readFormValue(formData, "status"),
    interviewAt: readFormValue(formData, "interviewAt")
  });

  if (!parsed.success) {
    redirectWithError("invalid-application");
  }

  const { supabase, user } = await getAuthedSupabase();
  const interviewAt =
    parsed.data.interviewAt ??
    (parsed.data.status === "interview" || parsed.data.status === "offer" ? todayIsoDate() : null);

  const { error } = await supabase
    .from("resume_ab_applications")
    .update({
      status: parsed.data.status,
      interview_at: interviewAt,
      updated_at: new Date().toISOString()
    })
    .eq("id", parsed.data.applicationId)
    .eq("user_id", user.id);

  if (error) {
    redirectForSupabaseError(error, "update-failed");
  }

  revalidatePath(dashboardPath);
  redirectWithSuccess("application-updated");
}

export async function deleteResumeAbApplicationAction(formData: FormData) {
  const parsed = deleteResumeAbApplicationSchema.safeParse({
    applicationId: readFormValue(formData, "applicationId")
  });

  if (!parsed.success) {
    redirectWithError("invalid-application");
  }

  const { supabase, user } = await getAuthedSupabase();
  const { error } = await supabase
    .from("resume_ab_applications")
    .delete()
    .eq("id", parsed.data.applicationId)
    .eq("user_id", user.id);

  if (error) {
    redirectForSupabaseError(error, "delete-failed");
  }

  revalidatePath(dashboardPath);
  redirectWithSuccess("application-deleted");
}
