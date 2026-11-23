import { z } from "zod";

export const personNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(60)
  .regex(/^\p{L}[\p{L}\p{M}' .-]*$/u);

export function normalizePhone(value: string) {
  return value.trim().replace(/[\s().-]/g, "");
}

export const phoneSchema = z
  .string()
  .trim()
  .max(32)
  .refine((value) => /^\+?\d{8,15}$/.test(normalizePhone(value)));
