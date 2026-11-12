import { z } from "zod";

const absoluteUrl = z.string().refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}, "Expected an absolute http(s) URL");

export const productSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  price: z.number().nonnegative(),
  description: z.string(),
  category: z.string().min(1),
  imageUrl: absoluteUrl,
  rating: z.number().nonnegative(),
  ratingCount: z.number().int().nonnegative(),
});

export type Product = z.infer<typeof productSchema>;
