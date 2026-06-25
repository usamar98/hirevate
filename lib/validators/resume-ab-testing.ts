import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((value) => (value ? value : null));

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null))
  .pipe(z.string().url().nullable());

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null))
  .pipe(z.string().date().nullable());

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null))
  .pipe(z.string().email().nullable());

export const resumeVariantSchema = z.enum(["A", "B"]);
export const applicationStatusSchema = z.enum(["applied", "interview", "offer", "rejected"]);
export const applicationChannelSchema = z.enum(["direct", "referral", "recruiter", "job_board", "other"]);

export const createResumeAbTestSchema = z.object({
  name: z.string().trim().min(2, "Name the test.").max(120),
  resumeAName: z.string().trim().min(1, "Name version A.").max(80),
  resumeANotes: optionalText,
  resumeBName: z.string().trim().min(1, "Name version B.").max(80),
  resumeBNotes: optionalText
});

export const createResumeAbApplicationSchema = z.object({
  abTestId: z.string().uuid(),
  resumeVariant: resumeVariantSchema,
  jobTitle: z.string().trim().min(2, "Enter a job title.").max(160),
  company: optionalText,
  contactName: optionalText,
  contactEmail: optionalEmail,
  status: applicationStatusSchema,
  applicationChannel: applicationChannelSchema,
  appliedAt: z.string().date(),
  interviewAt: optionalDate,
  nextFollowUpAt: optionalDate,
  sourceUrl: optionalUrl,
  resumeSnapshotUrl: optionalUrl,
  notes: optionalText
});

export const updateResumeAbApplicationStatusSchema = z.object({
  applicationId: z.string().uuid(),
  status: applicationStatusSchema,
  interviewAt: optionalDate
});

export const deleteResumeAbApplicationSchema = z.object({
  applicationId: z.string().uuid()
});

export type CreateResumeAbApplicationInput = z.infer<typeof createResumeAbApplicationSchema>;
export type CreateResumeAbTestInput = z.infer<typeof createResumeAbTestSchema>;
