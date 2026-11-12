import { logger } from "../logger.js";
import type { ProductSource } from "../ports/productSource.js";
import type { Product } from "../domain/product.js";

/** Tries the live source, and serves the snapshot when that call fails. */
export class FallbackProductSource implements ProductSource {
  constructor(
    private readonly primary: ProductSource,
    private readonly secondary: ProductSource,
  ) {}

  async listProducts(): Promise<Product[]> {
    try {
      return await this.primary.listProducts();
    } catch (error) {
      logger.warn("product source failed; serving the snapshot", {
        error: error instanceof Error ? error.message : "unknown",
      });
      return this.secondary.listProducts();
    }
  }
}
