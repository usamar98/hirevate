import type { Job } from "@/types/database";

type DisplayJob = Pick<Job, "location" | "remote_type">;

function cleanLocation(value: string | null | undefined) {
  return (value ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s*-\s*/g, " - ")
    .trim();
}

export function getWorkModeLabel(remoteType: string | null | undefined) {
  if (remoteType === "remote") return "Remote";
  if (remoteType === "hybrid") return "Hybrid";
  if (remoteType === "onsite") return "On-site";
  return "Work mode not listed";
}

export function getWorkModeTone(remoteType: string | null | undefined): "green" | "blue" | "amber" | "gray" {
  if (remoteType === "remote") return "green";
  if (remoteType === "hybrid") return "blue";
  if (remoteType === "onsite") return "gray";
  return "amber";
}

export function getJobLocationLabel(job: DisplayJob) {
  const location = cleanLocation(job.location);

  if (location) {
    if (job.remote_type === "remote" && /^remote$/i.test(location)) return "Remote";
    return location;
  }

  if (job.remote_type === "remote") return "Remote";
  if (job.remote_type === "hybrid") return "Hybrid location not listed";
  if (job.remote_type === "onsite") return "Location not listed";

  return "Location not listed";
}
