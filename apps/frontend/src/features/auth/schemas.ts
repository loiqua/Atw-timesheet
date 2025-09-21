import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must include at least one uppercase letter')
  .regex(/[a-z]/, 'Must include at least one lowercase letter')
  .regex(/\d/, 'Must include at least one number')
  .regex(/[^A-Za-z0-9]/, 'Must include at least one special character');

export const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().email({ message: 'Invalid email' }),
    username: z
      .string()
      .min(3, 'Username must be at least 3 chars')
      .regex(/^[A-Za-z][A-Za-z0-9._-]{2,}$/u, 'Only letters, numbers, dot, dash, underscore. Must start with a letter'),
    password: passwordSchema,
    confirmPassword: z.string(),
    domainId: z.string().uuid({ message: 'Le domaine est requis' }),
    adminKey: z.string().optional(),
  })
  .refine((val) => val.password === val.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterValues = z.infer<typeof registerSchema>;
