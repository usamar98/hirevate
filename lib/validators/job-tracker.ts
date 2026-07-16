import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((value) => (value ? value : null));

const optionalShortText = z
  .string()
  .trim()
  .max(180)
  .optional()
  .transform((value) => (value ? value : null));

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null))
  .pipe(z.string().date().nullable());

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null))
  .pipe(z.string().url().nullable());

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null))
  .pipe(z.string().email().nullable());

export const jobApplicationStatusSchema = z.enum([
  "interested",
  "applied",
  "screening",
  "interview",
  "assessment",
  "final_interview",
  "offer",
  "accepted",
  "rejected",
  "withdrawn"
]);

export const jobApplicationPrioritySchema = z.enum(["low", "medium", "high"]);

export const createJobApplicationSchema = z.object({
  jobId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null))
    .pipe(z.string().uuid().nullable()),
  jobTitle: z.string().trim().min(2, "Enter a job title.").max(180),
  company: z.string().trim().min(1, "Enter a company.").max(160),
  location: optionalShortText,
  jobUrl: optionalUrl,
  status: jobApplicationStatusSchema,
  priority: jobApplicationPrioritySchema,
  contactName: optionalShortText,
  contactEmail: optionalEmail,
  salaryRange: optionalShortText,
  appliedAt: optionalDate,
  nextFollowUpAt: optionalDate,
  nextAction: optionalShortText,
  notes: optionalText
});

export const updateJobApplicationStatusSchema = z.object({
  applicationId: z.string().uuid(),
  status: jobApplicationStatusSchema,
  priority: jobApplicationPrioritySchema,
  nextFollowUpAt: optionalDate,
  nextAction: optionalShortText
});

export const archiveJobApplicationSchema = z.object({
  applicationId: z.string().uuid(),
  archiveAction: z.enum(["archive", "restore"])
});

export const deleteJobApplicationSchema = z.object({
  applicationId: z.string().uuid()
});

export type JobApplicationStatus = z.infer<typeof jobApplicationStatusSchema>;
export type JobApplicationPriority = z.infer<typeof jobApplicationPrioritySchema>;
