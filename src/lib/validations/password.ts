import { z } from "zod";

const passwordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(100),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

export { passwordSchema };