import { readFile } from "node:fs/promises";
import { z } from "zod";
import { productSchema, type Product } from "../domain/product.js";
import type { ProductSource } from "../ports/productSource.js";

export class SnapshotProductSource implements ProductSource {
  constructor(private readonly filePath: string) {}

  async listProducts(): Promise<Product[]> {
    const text = await readFile(this.filePath, "utf8");
    return z.array(productSchema).parse(JSON.parse(text));
  }
}
