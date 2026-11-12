import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { Express } from "express";
import type { Product } from "../src/domain/product.js";
import type { ProductSource } from "../src/ports/productSource.js";
import { CatalogueService } from "../src/services/catalogueService.js";

export class InMemoryProductSource implements ProductSource {
  constructor(private readonly products: Product[]) {}

  async listProducts(): Promise<Product[]> {
    return this.products;
  }
}

export function product(overrides: Partial<Product> & Pick<Product, "id" | "title" | "category">): Product {
  return {
    price: 10,
    description: "Description",
    imageUrl: "https://example.com/product.png",
    rating: 4,
    ratingCount: 10,
    ...overrides,
  };
}

export function makeCatalogue(products: Product[], featuredIds: number[], ttlMs = 0): CatalogueService {
  return new CatalogueService(new InMemoryProductSource(products), featuredIds, ttlMs);
}

export async function withApp(app: Express, run: (baseURL: string) => Promise<void>): Promise<void> {
  const server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind to a port.");
  try {
    await run(`http://127.0.0.1:${(address as AddressInfo).port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}
