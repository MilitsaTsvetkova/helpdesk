import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters."),
  email: z.email("A valid email is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export type CreateUserData = z.infer<typeof createUserSchema>;

export const editUserSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters."),
  email: z.email("A valid email is required."),
  // Empty string = keep existing password; 8+ chars = change it
  password: z.string().refine(
    (val) => val === "" || val.length >= 8,
    "Password must be at least 8 characters."
  ),
});

export type EditUserData = z.infer<typeof editUserSchema>;
