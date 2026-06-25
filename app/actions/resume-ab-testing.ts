"use server";

import { revalidatePath } from "next/cache";
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

function readFormValue(formData: FormData, key: string) {
  return formData.get(key)?.toString() ?? "";
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

async function getAuthedSupabase() {
  const user = await requireUser(dashboardPath);
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
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
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid resume test.");
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
    throw new Error(error.message);
  }

  revalidatePath(dashboardPath);
}

export async function createResumeAbApplicationAction(formData: FormData) {
  const parsed = createResumeAbApplicationSchema.safeParse({
    abTestId: readFormValue(formData, "abTestId"),
    resumeVariant: readFormValue(formData, "resumeVariant"),
    jobTitle: readFormValue(formData, "jobTitle"),
    company: readFormValue(formData, "company"),
    status: readFormValue(formData, "status") || "applied",
    appliedAt: readFormValue(formData, "appliedAt") || todayIsoDate(),
    interviewAt: readFormValue(formData, "interviewAt"),
    sourceUrl: readFormValue(formData, "sourceUrl"),
    notes: readFormValue(formData, "notes")
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid application.");
  }

  const { supabase, user } = await getAuthedSupabase();
  const { data: test, error: testError } = await supabase
    .from("resume_ab_tests")
    .select("id")
    .eq("id", parsed.data.abTestId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (testError) {
    throw new Error(testError.message);
  }

  if (!test) {
    throw new Error("Resume test not found.");
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
    status: parsed.data.status,
    applied_at: parsed.data.appliedAt,
    interview_at: interviewAt,
    source_url: parsed.data.sourceUrl,
    notes: parsed.data.notes
  };

  const { error } = await supabase.from("resume_ab_applications").insert(insert);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(dashboardPath);
}

export async function updateResumeAbApplicationStatusAction(formData: FormData) {
  const parsed = updateResumeAbApplicationStatusSchema.safeParse({
    applicationId: readFormValue(formData, "applicationId"),
    status: readFormValue(formData, "status"),
    interviewAt: readFormValue(formData, "interviewAt")
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid application status.");
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
    throw new Error(error.message);
  }

  revalidatePath(dashboardPath);
}

export async function deleteResumeAbApplicationAction(formData: FormData) {
  const parsed = deleteResumeAbApplicationSchema.safeParse({
    applicationId: readFormValue(formData, "applicationId")
  });

  if (!parsed.success) {
    throw new Error("Invalid application.");
  }

  const { supabase, user } = await getAuthedSupabase();
  const { error } = await supabase
    .from("resume_ab_applications")
    .delete()
    .eq("id", parsed.data.applicationId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(dashboardPath);
}
