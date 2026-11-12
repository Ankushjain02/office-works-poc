import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { SnapshotProductSource } from "../src/adapters/snapshotProductSource.js";
import { listCategories, searchProducts, selectFeatured, splitCategory } from "../src/domain/catalogueRules.js";
import { readFeaturedProductIds } from "../src/domain/featured.js";
import { backendRoot } from "../src/paths.js";
import { makeCatalogue, product } from "./helpers.js";

const gear = [
  product({ id: 11, title: "SSD", category: "electronics", rating: 4.8, description: "fast (nand) drive" }),
  product({ id: 1, title: "Bag", category: "men's clothing", rating: 3.9, description: "holds a laptop" }),
  product({ id: 2, title: "Alpha cable", category: "electronics", rating: 1, description: "plain" }),
  product({ id: 3, title: "Zebra mount", category: "electronics", rating: 5, description: "plain" }),
];

describe("featured selection", () => {
  it("keeps the merchant's order instead of sorting by rating", () => {
    assert.deepEqual(
      selectFeatured(gear, [1, 11]).map((item) => item.id),
      [1, 11],
    );
  });

  it("skips ids that are not in the catalogue", () => {
    assert.deepEqual(
      selectFeatured(gear, [1, 99, 11]).map((item) => item.id),
      [1, 11],
    );
  });

  it("serves the chosen products through the catalogue service", async () => {
    const catalogue = makeCatalogue(gear, [1, 11]);
    assert.deepEqual((await catalogue.featured()).map((item) => item.id), [1, 11]);
  });
});

describe("categories", () => {
  it("puts curated products in top rated and the rest in additional, without overlap", () => {
    const listing = splitCategory(gear, "ELECTRONICS", [11]);
    assert.deepEqual(listing?.topRated.map((item) => item.id), [11]);
    assert.deepEqual(listing?.additional.map((item) => item.title), ["Alpha cable", "Zebra mount"]);
  });

  it("returns null for an unknown category", () => {
    assert.equal(splitCategory(gear, "missing", [1]), null);
  });
});

describe("search", () => {
  it("matches case-insensitively and ranks a title match ahead of a description match", () => {
    const products = [
      product({ id: 1, title: "Plain shirt", category: "men's clothing", description: "cotton jacket" }),
      product({ id: 2, title: "Cotton shirt", category: "men's clothing", description: "plain" }),
    ];
    assert.deepEqual(
      searchProducts(products, "COTTON").map((item) => item.id),
      [2, 1],
    );
  });

  it("treats the term as literal text", () => {
    assert.deepEqual(
      searchProducts(gear, "(").map((item) => item.id),
      [11],
    );
    assert.deepEqual(searchProducts(gear, ".*"), []);
  });
});

describe("committed catalogue", () => {
  it("loads the snapshot, including image URLs that contain a plus", async () => {
    const products = await new SnapshotProductSource(resolve(backendRoot, "data/products.snapshot.json")).listProducts();
    const drive = products.find((item) => item.id === 11);
    assert.ok(drive);
    assert.match(drive.imageUrl, /\+/);
    assert.equal(products.length, 20);
  });

  it("gives every category a top rated product and at least one additional product", async () => {
    const products = await new SnapshotProductSource(resolve(backendRoot, "data/products.snapshot.json")).listProducts();
    const featuredIds = readFeaturedProductIds(
      JSON.parse(readFileSync(resolve(backendRoot, "config/featured-products.json"), "utf8")),
    );
    assert.deepEqual(featuredIds, [1, 5, 9, 15, 11]);
    assert.deepEqual(
      selectFeatured(products, featuredIds).map((item) => item.id),
      featuredIds,
    );
    for (const category of listCategories(products)) {
      const listing = splitCategory(products, category, featuredIds);
      assert.ok(listing, category);
      assert.ok(listing.topRated.length >= 1, category);
      assert.ok(listing.additional.length >= 1, category);
      const topIds = new Set(listing.topRated.map((item) => item.id));
      for (const extra of listing.additional) assert.equal(topIds.has(extra.id), false);
    }
  });
});
