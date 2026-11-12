import { z } from "zod";
import type { Product } from "./product.js";

const namePattern = /^[\p{L}\p{M}][\p{L}\p{M}\s'.-]{1,79}$/u;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isPhone(value: string): boolean {
  if (!/^[+0-9][0-9\s().-]*$/.test(value)) return false;
  const digits = [...value].filter((character) => character >= "0" && character <= "9").length;
  return digits >= 8 && digits <= 15;
}

export const enquirySchema = z.object({
  productId: z
    .number({ required_error: "Choose a product.", invalid_type_error: "Choose a product." })
    .int()
    .positive(),
  name: z
    .string({ required_error: "Enter your name." })
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be 80 characters or fewer.")
    .regex(namePattern, "Use letters, spaces, apostrophes, or hyphens."),
  email: z
    .string({ required_error: "Enter your email address." })
    .trim()
    .max(254, "Email is too long.")
    .regex(emailPattern, "Enter a valid email address."),
  phone: z
    .string({ required_error: "Enter your phone number." })
    .trim()
    .max(30, "Phone number is too long.")
    .refine(isPhone, "Enter a phone number with 8 to 15 digits."),
  message: z.string().trim().max(1000, "Message must be 1000 characters or fewer.").optional().default(""),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

export function enquiryFieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string" || key in fields) continue;
    fields[key] = issue.message;
  }
  return fields;
}

export function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

export function renderEnquiry(input: {
  reference: string;
  product: Product;
  name: string;
  email: string;
  phone: string;
  message: string;
}): string {
  const lines = [
    "New product enquiry",
    "",
    `Reference: ${input.reference}`,
    `Product: ${input.product.title}`,
    `Product ID: ${input.product.id}`,
    `Price: USD ${input.product.price.toFixed(2)}`,
    "",
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone}`,
  ];
  if (input.message.trim() !== "") {
    lines.push("", "Message:", input.message.trim());
  }
  return lines.join("\n");
}
