"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  archiveJobApplicationSchema,
  createJobApplicationSchema,
  deleteJobApplicationSchema,
  updateJobApplicationStatusSchema
} from "@/lib/validators/job-tracker";
import type { Database } from "@/types/database";

const trackerPath = "/dashboard/job-tracker";

function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function redirectWith(key: "trackerError" | "trackerSuccess", value: string): never {
  redirect(`${trackerPath}?${key}=${encodeURIComponent(value)}`);
}

function isMissingLifecycleError(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "42P01" ||
    error?.code === "42703" ||
    /job_applications|job_application_events|archived_at|listing_status|priority/i.test(
      error?.message ?? ""
    )
  );
}

export async function createJobApplicationAction(formData: FormData) {
  const user = await requireUser(trackerPath);
  const parsed = createJobApplicationSchema.safeParse({
    jobId: readFormValue(formData, "jobId"),
    jobTitle: readFormValue(formData, "jobTitle"),
    company: readFormValue(formData, "company"),
    location: readFormValue(formData, "location"),
    jobUrl: readFormValue(formData, "jobUrl"),
    status: readFormValue(formData, "status"),
    priority: readFormValue(formData, "priority"),
    contactName: readFormValue(formData, "contactName"),
    contactEmail: readFormValue(formData, "contactEmail"),
    salaryRange: readFormValue(formData, "salaryRange"),
    appliedAt: readFormValue(formData, "appliedAt"),
    nextFollowUpAt: readFormValue(formData, "nextFollowUpAt"),
    nextAction: readFormValue(formData, "nextAction"),
    notes: readFormValue(formData, "notes")
  });

  if (!parsed.success) {
    redirectWith("trackerError", "invalid");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirectWith("trackerError", "setup");
  }

  const row: Database["public"]["Tables"]["job_applications"]["Insert"] = {
    user_id: user.id,
    job_id: parsed.data.jobId,
    job_title: parsed.data.jobTitle,
    company: parsed.data.company,
    location: parsed.data.location,
    job_url: parsed.data.jobUrl,
    status: parsed.data.status,
    priority: parsed.data.priority,
    contact_name: parsed.data.contactName,
    contact_email: parsed.data.contactEmail,
    salary_range: parsed.data.salaryRange,
    applied_at: parsed.data.appliedAt,
    next_follow_up_at: parsed.data.nextFollowUpAt,
    next_action: parsed.data.nextAction,
    notes: parsed.data.notes,
    status_changed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (parsed.data.jobId) {
    const { data: existing, error: existingError } = await supabase
      .from("job_applications")
      .select("id")
      .eq("user_id", user.id)
      .eq("job_id", parsed.data.jobId)
      .maybeSingle();

    if (existingError) {
      console.error("Failed to check tracked job", existingError);
      redirectWith("trackerError", isMissingLifecycleError(existingError) ? "setup" : "save");
    }

    if (existing) {
      const { error } = await supabase
        .from("job_applications")
        .update({ ...row, archived_at: null })
        .eq("user_id", user.id)
        .eq("id", existing.id);

      if (error) {
        console.error("Failed to update tracked job", error);
        redirectWith("trackerError", isMissingLifecycleError(error) ? "setup" : "save");
      }

      revalidatePath(trackerPath);
      redirectWith("trackerSuccess", "updated");
    }
  }

  const { error } = await supabase.from("job_applications").insert(row);

  if (error) {
    console.error("Failed to create tracked job", error);
    redirectWith("trackerError", isMissingLifecycleError(error) ? "setup" : "save");
  }

  revalidatePath(trackerPath);
  redirectWith("trackerSuccess", "created");
}

export async function updateJobApplicationStatusAction(formData: FormData) {
  const user = await requireUser(trackerPath);
  const parsed = updateJobApplicationStatusSchema.safeParse({
    applicationId: readFormValue(formData, "applicationId"),
    status: readFormValue(formData, "status"),
    priority: readFormValue(formData, "priority"),
    nextFollowUpAt: readFormValue(formData, "nextFollowUpAt"),
    nextAction: readFormValue(formData, "nextAction")
  });

  if (!parsed.success) {
    redirectWith("trackerError", "invalid");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirectWith("trackerError", "setup");
  }

  const { error } = await supabase
    .from("job_applications")
    .update({
      status: parsed.data.status,
      priority: parsed.data.priority,
      next_follow_up_at: parsed.data.nextFollowUpAt,
      next_action: parsed.data.nextAction,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", user.id)
    .eq("id", parsed.data.applicationId);

  if (error) {
    console.error("Failed to update tracked job status", error);
    redirectWith("trackerError", isMissingLifecycleError(error) ? "setup" : "update");
  }

  revalidatePath(trackerPath);
  redirectWith("trackerSuccess", "updated");
}

export async function archiveJobApplicationAction(formData: FormData) {
  const user = await requireUser(trackerPath);
  const parsed = archiveJobApplicationSchema.safeParse({
    applicationId: readFormValue(formData, "applicationId"),
    archiveAction: readFormValue(formData, "archiveAction")
  });

  if (!parsed.success) {
    redirectWith("trackerError", "invalid");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirectWith("trackerError", "setup");
  }

  const { error } = await supabase
    .from("job_applications")
    .update({
      archived_at: parsed.data.archiveAction === "archive" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", user.id)
    .eq("id", parsed.data.applicationId);

  if (error) {
    console.error("Failed to archive tracked job", error);
    redirectWith("trackerError", isMissingLifecycleError(error) ? "setup" : "update");
  }

  revalidatePath(trackerPath);
  redirectWith(
    "trackerSuccess",
    parsed.data.archiveAction === "archive" ? "archived" : "restored"
  );
}

export async function deleteJobApplicationAction(formData: FormData) {
  const user = await requireUser(trackerPath);
  const parsed = deleteJobApplicationSchema.safeParse({
    applicationId: readFormValue(formData, "applicationId")
  });

  if (!parsed.success) {
    redirectWith("trackerError", "invalid");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirectWith("trackerError", "setup");
  }

  const { error } = await supabase
    .from("job_applications")
    .delete()
    .eq("user_id", user.id)
    .eq("id", parsed.data.applicationId);

  if (error) {
    console.error("Failed to delete tracked job", error);
    redirectWith("trackerError", isMissingLifecycleError(error) ? "setup" : "delete");
  }

  revalidatePath(trackerPath);
  redirectWith("trackerSuccess", "deleted");
}
