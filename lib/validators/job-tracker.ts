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
  "interview",
  "offer",
  "rejected",
  "withdrawn"
]);

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
  contactName: optionalShortText,
  contactEmail: optionalEmail,
  salaryRange: optionalShortText,
  appliedAt: optionalDate,
  nextFollowUpAt: optionalDate,
  notes: optionalText
});

export const updateJobApplicationStatusSchema = z.object({
  applicationId: z.string().uuid(),
  status: jobApplicationStatusSchema,
  nextFollowUpAt: optionalDate
});

export const deleteJobApplicationSchema = z.object({
  applicationId: z.string().uuid()
});

export type JobApplicationStatus = z.infer<typeof jobApplicationStatusSchema>;
