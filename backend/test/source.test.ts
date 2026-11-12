import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FallbackProductSource } from "../src/adapters/fallbackProductSource.js";
import { FakeStoreProductSource, type FetchLike } from "../src/adapters/fakeStoreProductSource.js";
import { mapFakeStoreProduct } from "../src/adapters/fakeStoreProductSource.js";
import type { ProductSource } from "../src/ports/productSource.js";
import { product } from "./helpers.js";

const rawBackpack = {
  id: 1,
  title: " Bag ",
  price: 109.95,
  description: " Everyday pack ",
  category: " men's clothing ",
  image: "https://fakestoreapi.com/img/a+b.png",
  rating: { rate: 3.9, count: 120 },
};

describe("Fake Store mapper", () => {
  it("maps the upstream shape onto our product and trims text", () => {
    const mapped = mapFakeStoreProduct(rawBackpack);
    assert.equal(mapped.title, "Bag");
    assert.equal(mapped.category, "men's clothing");
    assert.equal(mapped.description, "Everyday pack");
    assert.equal(mapped.imageUrl, "https://fakestoreapi.com/img/a+b.png");
    assert.equal(mapped.rating, 3.9);
    assert.equal(mapped.ratingCount, 120);
    assert.equal("image" in mapped, false);
  });
});

describe("Fake Store source", () => {
  it("skips a bad row and keeps a valid one", async () => {
    const fetchImpl: FetchLike = async () =>
      new Response(JSON.stringify([rawBackpack, { id: "bad" }]), { status: 200 });
    const source = new FakeStoreProductSource("https://fakestoreapi.com", fetchImpl);
    const products = await source.listProducts();
    assert.equal(products.length, 1);
    assert.equal(products[0]?.title, "Bag");
  });

  it("fails when the response is not usable", async () => {
    const fetchImpl: FetchLike = async () => new Response("[]", { status: 200 });
    const source = new FakeStoreProductSource("https://fakestoreapi.com", fetchImpl);
    await assert.rejects(() => source.listProducts(), /no usable products/);
  });
});

describe("fallback source", () => {
  it("serves the secondary source when the primary fails", async () => {
    const primary: ProductSource = {
      async listProducts() {
        throw new Error("down");
      },
    };
    const expected = [product({ id: 1, title: "Bag", category: "men's clothing" })];
    const secondary: ProductSource = {
      async listProducts() {
        return expected;
      },
    };
    const products = await new FallbackProductSource(primary, secondary).listProducts();
    assert.deepEqual(products, expected);
  });
});
