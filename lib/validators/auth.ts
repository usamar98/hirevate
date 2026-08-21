import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Enter a valid email address or username.")
  .max(40, "Enter a valid email address or username.")
  .regex(/^[a-zA-Z0-9._-]+$/, "Enter a valid email address or username.");

const editableUsernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(40, "Username must be 40 characters or fewer.")
  .regex(/^[a-zA-Z0-9._-]+$/, "Use only letters, numbers, dots, dashes, or underscores.");

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
  fullName: z.string().trim().min(2, "Enter your full name.").max(120),
  website: z.string().max(200).optional()
});

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.")
});

export const passwordUpdateSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password.")
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"]
  });

export const accountProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(120),
  username: editableUsernameSchema,
  email: z.string().trim().email("Enter a valid email address."),
  countryName: z.string().trim().max(80, "Location must be 80 characters or fewer.").optional()
});

export const accountPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password.")
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"]
  });

export type AuthFormValues = z.infer<typeof signUpSchema>;
export type PasswordResetRequestValues = z.infer<typeof passwordResetRequestSchema>;
export type PasswordUpdateValues = z.infer<typeof passwordUpdateSchema>;
export type AccountProfileValues = z.infer<typeof accountProfileSchema>;
export type AccountPasswordValues = z.infer<typeof accountPasswordSchema>;
