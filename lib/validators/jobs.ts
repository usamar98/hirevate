import { z } from "zod";

export const jobSearchSchema = z.object({
  keyword: z.string().trim().max(120).optional().default(""),
  location: z.string().trim().max(120).optional().default(""),
  remote: z.enum(["on", "true"]).optional(),
  freshness: z.enum(["fresh", "good", "all"]).optional().default("all"),
  sort: z.enum(["newest", "freshness"]).optional().default("newest")
});

export const saveJobSchema = z.object({
  jobId: z.string().uuid()
});

export type JobSearchInput = z.infer<typeof jobSearchSchema>;
