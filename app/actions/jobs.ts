"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfile, isPaidSubscription } from "@/lib/auth/session";
import { countSavedJobs } from "@/lib/jobs/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveJobSchema } from "@/lib/validators/jobs";
import type { Database } from "@/types/database";

const FREE_SAVED_JOB_LIMIT = 5;

function readRedirectPath(formData: FormData) {
  const redirectPath = formData.get("redirectPath");
  return typeof redirectPath === "string" && redirectPath.length > 0 ? redirectPath : undefined;
}

function getFallbackJobPath(jobId: string) {
  return `/jobs/${jobId}`;
}

function revalidateJobSurfaces(jobId: string, redirectPath?: string) {
  revalidatePath("/jobs");
  revalidatePath(getFallbackJobPath(jobId));

  if (redirectPath) {
    revalidatePath(redirectPath);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/saved");
}

export async function saveJobAction(formData: FormData) {
  const parsed = saveJobSchema.safeParse({
    jobId: formData.get("jobId"),
    redirectPath: readRedirectPath(formData)
  });

  if (!parsed.success) {
    throw new Error("Invalid job id.");
  }

  const returnPath = parsed.data.redirectPath ?? getFallbackJobPath(parsed.data.jobId);

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(returnPath)}`);
  }

  const profile = await getProfile(user.id);
  const { data: existingSavedJob, error: existingSavedJobError } = await supabase
    .from("saved_jobs")
    .select("id")
    .eq("user_id", user.id)
    .eq("job_id", parsed.data.jobId)
    .maybeSingle();

  if (existingSavedJobError) {
    throw new Error(existingSavedJobError.message);
  }

  if (existingSavedJob) {
    revalidateJobSurfaces(parsed.data.jobId, parsed.data.redirectPath);
    return;
  }

  const savedCount = await countSavedJobs(user.id);

  if (!isPaidSubscription(profile?.subscription_status) && savedCount >= FREE_SAVED_JOB_LIMIT) {
    redirect("/pricing?limit=saved-jobs");
  }

  const savedJob: Database["public"]["Tables"]["saved_jobs"]["Insert"] = {
    user_id: user.id,
    job_id: parsed.data.jobId
  };

  const { error } = await supabase.from("saved_jobs").insert(savedJob);

  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }

  revalidateJobSurfaces(parsed.data.jobId, parsed.data.redirectPath);
}

export async function deleteSavedJobAction(formData: FormData) {
  const parsed = saveJobSchema.safeParse({
    jobId: formData.get("jobId"),
    redirectPath: readRedirectPath(formData)
  });

  if (!parsed.success) {
    throw new Error("Invalid job id.");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const returnPath = parsed.data.redirectPath ?? getFallbackJobPath(parsed.data.jobId);
    redirect(`/login?redirect=${encodeURIComponent(returnPath)}`);
  }

  const { error } = await supabase
    .from("saved_jobs")
    .delete()
    .eq("user_id", user.id)
    .eq("job_id", parsed.data.jobId);

  if (error) {
    throw new Error(error.message);
  }

  revalidateJobSurfaces(parsed.data.jobId, parsed.data.redirectPath);
}
