import type {
  JobApplicationPriority,
  JobApplicationStatus,
  JobListingStatus
} from "@/types/database";

export const jobApplicationStatusOptions: Array<{
  value: JobApplicationStatus;
  label: string;
  tone: "gray" | "blue" | "green" | "amber" | "red";
}> = [
  { value: "interested", label: "Interested", tone: "gray" },
  { value: "applied", label: "Applied", tone: "blue" },
  { value: "screening", label: "Screening", tone: "blue" },
  { value: "interview", label: "Interview", tone: "amber" },
  { value: "assessment", label: "Assessment", tone: "amber" },
  { value: "final_interview", label: "Final interview", tone: "amber" },
  { value: "offer", label: "Offer", tone: "green" },
  { value: "accepted", label: "Accepted", tone: "green" },
  { value: "rejected", label: "Rejected", tone: "red" },
  { value: "withdrawn", label: "Withdrawn", tone: "gray" }
];

const activeStageOrder: JobApplicationStatus[] = [
  "interested",
  "applied",
  "screening",
  "interview",
  "assessment",
  "final_interview",
  "offer",
  "accepted"
];

export const priorityOptions: Array<{
  value: JobApplicationPriority;
  label: string;
}> = [
  { value: "high", label: "High priority" },
  { value: "medium", label: "Medium priority" },
  { value: "low", label: "Low priority" }
];

export function getJobApplicationStatusMeta(status: JobApplicationStatus) {
  return jobApplicationStatusOptions.find((option) => option.value === status) ?? jobApplicationStatusOptions[0];
}

export function isOpenApplicationStatus(status: JobApplicationStatus) {
  return !["accepted", "rejected", "withdrawn"].includes(status);
}

export function getApplicationProgress(status: JobApplicationStatus) {
  const index = activeStageOrder.indexOf(status);

  if (status === "rejected" || status === "withdrawn") {
    return { current: null, total: activeStageOrder.length, percent: 100 };
  }

  const current = Math.max(index + 1, 1);
  return {
    current,
    total: activeStageOrder.length,
    percent: Math.round((current / activeStageOrder.length) * 100)
  };
}

export function getNextActionSuggestion(status: JobApplicationStatus) {
  const suggestions: Record<JobApplicationStatus, string> = {
    interested: "Tailor your resume and decide whether to apply.",
    applied: "Confirm receipt and schedule a follow-up in 5 to 7 days.",
    screening: "Prepare a concise career story and role-specific examples.",
    interview: "Research the interviewers and prepare STAR examples.",
    assessment: "Confirm the deadline, format, and submission requirements.",
    final_interview: "Prepare decision-stage questions and compensation priorities.",
    offer: "Review compensation, scope, start date, and negotiation points.",
    accepted: "Save the offer details and complete onboarding tasks.",
    rejected: "Record useful feedback and archive when ready.",
    withdrawn: "Record why you withdrew for future search decisions."
  };

  return suggestions[status];
}

export function getListingStatusMeta(status: JobListingStatus) {
  const values: Record<
    JobListingStatus,
    { label: string; tone: "gray" | "green" | "amber" | "red" }
  > = {
    active: { label: "Listing active", tone: "green" },
    closed: { label: "Listing closed", tone: "amber" },
    unavailable: { label: "Source unavailable", tone: "red" },
    unknown: { label: "Listing not monitored", tone: "gray" }
  };

  return values[status];
}
