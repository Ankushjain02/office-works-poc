import type { Product } from "./product.js";

export interface CategoryListing {
  category: string;
  topRated: Product[];
  additional: Product[];
}

export function selectFeatured(products: readonly Product[], featuredIds: readonly number[]): Product[] {
  const byId = new Map(products.map((product) => [product.id, product]));
  const selected: Product[] = [];
  for (const id of featuredIds) {
    const product = byId.get(id);
    if (product) selected.push(product);
  }
  return selected;
}

export function listCategories(products: readonly Product[]): string[] {
  return [...new Set(products.map((product) => product.category))].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
}

export function splitCategory(
  products: readonly Product[],
  category: string,
  featuredIds: readonly number[],
): CategoryListing | null {
  const requested = category.trim().toLowerCase();
  if (requested === "") return null;
  const canonical = products.find((product) => product.category.toLowerCase() === requested)?.category;
  if (!canonical) return null;

  const inCategory = products.filter((product) => product.category === canonical);
  const featured = new Set(featuredIds);
  const topRated = selectFeatured(inCategory, featuredIds);
  const additional = inCategory
    .filter((product) => !featured.has(product.id))
    .sort((left, right) => left.title.localeCompare(right.title, "en", { sensitivity: "base" }));

  return { category: canonical, topRated, additional };
}

export function searchProducts(products: readonly Product[], query: string): Product[] {
  const needle = query.trim().toLocaleLowerCase("en");
  if (needle === "") return [];

  const ranked = products.flatMap((product) => {
    const title = product.title.toLocaleLowerCase("en");
    const category = product.category.toLocaleLowerCase("en");
    const description = product.description.toLocaleLowerCase("en");
    const rank = title.includes(needle) ? 0 : category.includes(needle) ? 1 : description.includes(needle) ? 2 : null;
    return rank === null ? [] : [{ product, rank }];
  });

  ranked.sort(
    (left, right) =>
      left.rank - right.rank || left.product.title.localeCompare(right.product.title, "en", { sensitivity: "base" }),
  );
  return ranked.map((entry) => entry.product);
}

export function findProduct(products: readonly Product[], id: number): Product | null {
  return products.find((product) => product.id === id) ?? null;
}
