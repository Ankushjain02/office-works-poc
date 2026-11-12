import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createApp } from "../src/app.js";
import type { EmailSender, OutboundEmail } from "../src/ports/emailSender.js";
import { EnquiryService } from "../src/services/enquiryService.js";
import { makeCatalogue, product, withApp } from "./helpers.js";

const products = [
  product({ id: 1, title: "Bag", category: "men's clothing", price: 109.95, rating: 3.9, description: "holds a laptop" }),
  product({ id: 5, title: "Bracelet", category: "jewelery", price: 695, rating: 4.6 }),
  product({ id: 9, title: "Hard drive", category: "electronics", price: 64, rating: 3.3, description: "USB drive" }),
  product({ id: 10, title: "Cable", category: "electronics", price: 12, rating: 2 }),
  product({ id: 11, title: "SSD", category: "electronics", price: 109, rating: 4.8 }),
];

class RecordingEmail implements EmailSender {
  readonly sent: OutboundEmail[] = [];
  async send(email: OutboundEmail): Promise<void> {
    this.sent.push(email);
  }
}

function build(email: EmailSender = new RecordingEmail(), rateMax = 10) {
  const catalogue = makeCatalogue(products, [1, 5, 9, 15, 11]);
  const app = createApp({
    catalogue,
    enquiries: new EnquiryService(catalogue, email, "sales@example.com", "Catalogue <catalogue@localhost>", () => "enq_test"),
    rateLimit: { max: rateMax, windowMs: 60_000 },
  });
  return { app, email };
}

const enquiry = {
  productId: 1,
  name: "Ada Lovelace",
  email: "ada@example.com",
  phone: "+61 400 000 000",
  message: "Is this available?",
};

describe("http catalogue", () => {
  it("returns featured products in the chosen order and our field names", async () => {
    const { app } = build();
    await withApp(app, async (baseURL) => {
      const response = await fetch(`${baseURL}/api/products/featured`);
      assert.equal(response.status, 200);
      const body = (await response.json()) as { products: Array<Record<string, unknown>> };
      assert.deepEqual(
        body.products.map((item) => item.id),
        [1, 5, 9, 11],
      );
      assert.equal(body.products[0]?.imageUrl, "https://example.com/product.png");
      assert.equal(Object.hasOwn(body.products[0] ?? {}, "image"), false);
    });
  });

  it("splits a category into top rated and additional products", async () => {
    const { app } = build();
    await withApp(app, async (baseURL) => {
      const response = await fetch(`${baseURL}/api/products?category=electronics`);
      assert.equal(response.status, 200);
      const body = (await response.json()) as { topRated: Array<{ id: number }>; additional: Array<{ id: number }> };
      assert.deepEqual(body.topRated.map((item) => item.id), [9, 11]);
      assert.deepEqual(body.additional.map((item) => item.id), [10]);
    });
  });

  it("searches only when a term is provided", async () => {
    const { app } = build();
    await withApp(app, async (baseURL) => {
      const found = await fetch(`${baseURL}/api/products/search?q=drive`);
      const foundBody = (await found.json()) as { products: Array<{ id: number }> };
      assert.deepEqual(foundBody.products.map((item) => item.id), [9]);

      const missing = await fetch(`${baseURL}/api/products/search?q=`);
      assert.equal(missing.status, 400);
    });
  });

  it("returns 404 for an unknown product or category", async () => {
    const { app } = build();
    await withApp(app, async (baseURL) => {
      assert.equal((await fetch(`${baseURL}/api/products/404`)).status, 404);
      assert.equal((await fetch(`${baseURL}/api/products?category=missing`)).status, 404);
    });
  });
});

describe("http enquiry", () => {
  it("accepts a valid enquiry only after the email is sent", async () => {
    const email = new RecordingEmail();
    const { app } = build(email);
    await withApp(app, async (baseURL) => {
      const response = await fetch(`${baseURL}/api/enquiries`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(enquiry),
      });
      assert.equal(response.status, 201);
      const body = (await response.json()) as { status: string; reference: string };
      assert.equal(body.status, "accepted");
      assert.equal(body.reference, "enq_test");
      assert.equal(email.sent.length, 1);
      assert.equal(email.sent[0]?.to, "sales@example.com");
    });
  });

  it("rejects an invalid email and does not send", async () => {
    const email = new RecordingEmail();
    const { app } = build(email);
    await withApp(app, async (baseURL) => {
      const response = await fetch(`${baseURL}/api/enquiries`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...enquiry, email: "not-an-email" }),
      });
      assert.equal(response.status, 400);
      const body = (await response.json()) as { error: { fields?: Record<string, string> } };
      assert.equal(body.error.fields?.email, "Enter a valid email address.");
      assert.equal(email.sent.length, 0);
    });
  });

  it("does not accept the enquiry when email delivery fails", async () => {
    const email: EmailSender = {
      async send() {
        throw new Error("smtp down");
      },
    };
    const { app } = build(email);
    await withApp(app, async (baseURL) => {
      const response = await fetch(`${baseURL}/api/enquiries`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(enquiry),
      });
      assert.equal(response.status, 503);
    });
  });

  it("limits repeated enquiries", async () => {
    const email = new RecordingEmail();
    const { app } = build(email, 2);
    await withApp(app, async (baseURL) => {
      const send = () =>
        fetch(`${baseURL}/api/enquiries`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(enquiry),
        });
      assert.equal((await send()).status, 201);
      assert.equal((await send()).status, 201);
      assert.equal((await send()).status, 429);
      assert.equal(email.sent.length, 2);
    });
  });
});

describe("health", () => {
  it("responds without calling the product source", async () => {
    const { app } = build();
    await withApp(app, async (baseURL) => {
      const response = await fetch(`${baseURL}/health`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { status: "ok" });
    });
  });
});
