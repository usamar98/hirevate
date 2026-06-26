import type { JobApplicationStatus } from "@/lib/validators/job-tracker";

export const jobApplicationStatusOptions: Array<{
  value: JobApplicationStatus;
  label: string;
  tone: "gray" | "blue" | "green" | "amber" | "red";
}> = [
  { value: "interested", label: "Interested", tone: "gray" },
  { value: "applied", label: "Applied", tone: "blue" },
  { value: "interview", label: "Interview", tone: "amber" },
  { value: "offer", label: "Offer", tone: "green" },
  { value: "rejected", label: "Rejected", tone: "red" },
  { value: "withdrawn", label: "Withdrawn", tone: "gray" }
];

export function getJobApplicationStatusMeta(status: JobApplicationStatus) {
  return jobApplicationStatusOptions.find((option) => option.value === status) ?? jobApplicationStatusOptions[0];
}
