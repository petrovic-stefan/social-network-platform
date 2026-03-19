import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Neispravan email"),
  password: z.string().min(6, "Lozinka mora imati bar 6 karaktera"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Korisničko ime je obavezno"),
  firstName: z.string().min(2, "Ime je obavezno"),
  lastName: z.string().min(2, "Prezime je obavezno"),
  gender: z
    .string()
    .refine((v) => v === "Male" || v === "Female" || v === "Other", {
      message: "Pol je obavezan",
    }),
  email: z.string().email("Neispravan email"),
  password: z.string().min(6, "Lozinka mora imati bar 6 karaktera"),
});


export type LoginForm = z.input<typeof loginSchema>;
export type RegisterForm = z.input<typeof registerSchema>;
