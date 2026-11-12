import type { Product } from "../domain/product.js";

/** The only thing a product data source has to provide. Filtering stays in our catalogue service. */
export interface ProductSource {
  listProducts(): Promise<Product[]>;
}
