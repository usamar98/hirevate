import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Enter a valid email address or username.")
  .max(40, "Enter a valid email address or username.")
  .regex(/^[a-zA-Z0-9._-]+$/, "Enter a valid email address or username.");

const emailOrUsernameSchema = z.string().trim().refine(
  (value) => z.string().email().safeParse(value).success || usernameSchema.safeParse(value).success,
  "Enter a valid email address or username."
);

export const signInSchema = z.object({
  email: emailOrUsernameSchema,
  password: z.string().min(7, "Password must be at least 7 characters."),
  fullName: z.string().trim().max(120).optional()
});

export const signUpSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  fullName: z.string().trim().max(120).optional()
});

export type AuthFormValues = z.infer<typeof signUpSchema>;
