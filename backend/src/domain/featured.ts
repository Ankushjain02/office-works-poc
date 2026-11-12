import { z } from "zod";

const featuredFileSchema = z.object({
  productIds: z.array(z.number().int().positive()).min(1),
});

export function parseFeaturedProductIds(ids: readonly number[]): number[] {
  if (ids.length === 0) {
    throw new Error("Featured product list is empty.");
  }
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw new Error("Featured product ids must be positive integers.");
  }
  if (new Set(ids).size !== ids.length) {
    throw new Error("Featured product ids must be unique.");
  }
  return [...ids];
}

export function parseFeaturedProductIdList(value: string): number[] {
  const parts = value.split(",").map((part) => part.trim()).filter((part) => part !== "");
  const ids = parts.map((part) => {
    if (!/^[0-9]+$/.test(part)) {
      throw new Error("Featured product ids must be positive integers.");
    }
    return Number(part);
  });
  return parseFeaturedProductIds(ids);
}

export function readFeaturedProductIds(json: unknown): number[] {
  const parsed = featuredFileSchema.parse(json);
  return parseFeaturedProductIds(parsed.productIds);
}
