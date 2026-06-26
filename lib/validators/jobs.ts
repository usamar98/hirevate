import { z } from "zod";

export const jobSearchSchema = z.object({
  keyword: z.string().trim().max(120).optional().default(""),
  company: z.string().trim().max(120).optional().default(""),
  location: z.string().trim().max(120).optional().default(""),
  workMode: z.enum(["any", "remote", "hybrid", "onsite"]).optional().default("any"),
  postedWithin: z.enum(["all", "24h", "7d", "14d", "30d"]).optional().default("all"),
  remote: z.enum(["on", "true"]).optional(),
  freshness: z.enum(["fresh", "good", "all"]).optional().default("all"),
  sort: z.enum(["newest", "freshness", "updated"]).optional().default("newest"),
  page: z.preprocess((value) => {
    const page = Number(value);
    return Number.isFinite(page) && page > 0 ? page : 1;
  }, z.number().int().min(1).max(500))
});

export const saveJobSchema = z.object({
  jobId: z.string().uuid(),
  redirectPath: z
    .string()
    .trim()
    .max(512)
    .refine((value) => value.startsWith("/") && !value.startsWith("//"), {
      message: "Use an internal redirect path."
    })
    .optional()
});

export type JobSearchInput = z.infer<typeof jobSearchSchema>;
