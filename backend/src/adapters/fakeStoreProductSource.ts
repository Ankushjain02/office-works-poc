import type { Product } from "../domain/product.js";
import { productSchema } from "../domain/product.js";
import { logger } from "../logger.js";
import type { ProductSource } from "../ports/productSource.js";
import { z } from "zod";

const rawProductSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  price: z.number().nonnegative(),
  description: z.string(),
  category: z.string(),
  image: z.string(),
  rating: z.object({
    rate: z.number().nonnegative(),
    count: z.number().int().nonnegative(),
  }),
});

export type FetchLike = (url: URL, init?: { signal?: AbortSignal }) => Promise<Response>;

export function mapFakeStoreProduct(input: unknown): Product {
  const raw = rawProductSchema.parse(input);
  return productSchema.parse({
    id: raw.id,
    title: raw.title.trim(),
    price: raw.price,
    description: raw.description.trim(),
    category: raw.category.trim(),
    imageUrl: raw.image,
    rating: raw.rating.rate,
    ratingCount: raw.rating.count,
  });
}

export class FakeStoreProductSource implements ProductSource {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchImpl: FetchLike = (url, init) => fetch(url, init),
    private readonly timeoutMs = 8000,
  ) {}

  async listProducts(): Promise<Product[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(new URL("/products", this.baseUrl), { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Fake Store responded with ${response.status}.`);
      }
      const body: unknown = await response.json();
      if (!Array.isArray(body)) {
        throw new Error("Fake Store payload was not a list.");
      }
      const products: Product[] = [];
      for (const item of body) {
        try {
          products.push(mapFakeStoreProduct(item));
        } catch (error) {
          logger.warn("skipped invalid Fake Store product");
        }
      }
      if (products.length === 0) {
        throw new Error("Fake Store returned no usable products.");
      }
      return products;
    } finally {
      clearTimeout(timer);
    }
  }
}
