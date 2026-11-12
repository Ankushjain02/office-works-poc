import {
  findProduct,
  listCategories,
  searchProducts,
  selectFeatured,
  splitCategory,
  type CategoryListing,
} from "../domain/catalogueRules.js";
import type { Product } from "../domain/product.js";
import { logger } from "../logger.js";
import type { ProductSource } from "../ports/productSource.js";

export class CatalogueService {
  private cached: { at: number; products: Product[] } | null = null;

  constructor(
    private readonly source: ProductSource,
    private readonly featuredIds: readonly number[],
    private readonly ttlMs: number,
  ) {}

  async featured(): Promise<Product[]> {
    const products = await this.load();
    const selected = selectFeatured(products, this.featuredIds);
    if (selected.length !== this.featuredIds.length) {
      const found = new Set(selected.map((product) => product.id));
      logger.warn("featured products missing from catalogue", {
        missing: this.featuredIds.filter((id) => !found.has(id)),
      });
    }
    return selected;
  }

  async categories(): Promise<string[]> {
    return listCategories(await this.load());
  }

  async byCategory(category: string): Promise<CategoryListing | null> {
    return splitCategory(await this.load(), category, this.featuredIds);
  }

  async search(query: string): Promise<Product[]> {
    return searchProducts(await this.load(), query);
  }

  async byId(id: number): Promise<Product | null> {
    return findProduct(await this.load(), id);
  }

  private async load(): Promise<Product[]> {
    const now = Date.now();
    if (this.ttlMs > 0 && this.cached && now - this.cached.at < this.ttlMs) {
      return this.cached.products;
    }
    const products = await this.source.listProducts();
    if (this.ttlMs > 0) {
      this.cached = { at: now, products };
    }
    return products;
  }
}
