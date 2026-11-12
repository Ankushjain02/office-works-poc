import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { enquirySchema } from "../src/domain/enquiry.js";
import { HttpError } from "../src/httpError.js";
import type { EmailSender, OutboundEmail } from "../src/ports/emailSender.js";
import { EnquiryService } from "../src/services/enquiryService.js";
import { makeCatalogue, product } from "./helpers.js";

const bag = product({
  id: 1,
  title: "Bag\r\nBcc: leaked@example.com",
  category: "men's clothing",
  price: 109.95,
});

class RecordingEmail implements EmailSender {
  readonly sent: OutboundEmail[] = [];
  async send(email: OutboundEmail): Promise<void> {
    this.sent.push(email);
  }
}

const input = {
  productId: 1,
  name: "Ada Lovelace",
  email: "ada@example.com",
  phone: "+61 400 000 000",
  message: "Is the bag in stock?",
};

describe("enquiry validation", () => {
  const base = { productId: 1, email: "ada@example.com", phone: "0400000000", message: "" };

  it("accepts a unicode name and rejects digits in a name", () => {
    assert.equal(enquirySchema.safeParse({ ...base, name: "李雷" }).success, true);
    assert.equal(enquirySchema.safeParse({ ...base, name: "Ada1" }).success, false);
  });
});

describe("enquiry service", () => {
  it("emails the sales inbox and only then returns a reference", async () => {
    const email = new RecordingEmail();
    const service = new EnquiryService(makeCatalogue([bag], [1]), email, "sales@example.com", "Catalogue <catalogue@localhost>", () => "enq_test");
    const result = await service.submit(input);
    assert.equal(result.reference, "enq_test");
    assert.equal(email.sent.length, 1);
    const sent = email.sent[0];
    assert.ok(sent);
    assert.equal(sent.to, "sales@example.com");
    assert.equal(sent.subject, "Enquiry: Bag Bcc: leaked@example.com");
    assert.match(sent.text, /Ada Lovelace/);
    assert.match(sent.text, /ada@example.com/);
    assert.match(sent.text, /\+61 400 000 000/);
    assert.match(sent.text, /Is the bag in stock\?/);
    assert.match(sent.text, /enq_test/);
    assert.doesNotMatch(sent.subject, /[\r\n]/);
  });

  it("does not send mail for an unknown product", async () => {
    const email = new RecordingEmail();
    const service = new EnquiryService(makeCatalogue([bag], [1]), email, "sales@example.com", "from@localhost", () => "enq_test");
    await assert.rejects(() => service.submit({ ...input, productId: 99 }), (error: unknown) => {
      assert.ok(error instanceof HttpError);
      assert.equal(error.status, 404);
      return true;
    });
    assert.equal(email.sent.length, 0);
  });

  it("reports a delivery failure without claiming the enquiry was accepted", async () => {
    const email: EmailSender = {
      async send() {
        throw new Error("smtp down");
      },
    };
    const service = new EnquiryService(makeCatalogue([bag], [1]), email, "sales@example.com", "from@localhost", () => "enq_test");
    await assert.rejects(() => service.submit(input), (error: unknown) => {
      assert.ok(error instanceof HttpError);
      assert.equal(error.status, 503);
      assert.equal(error.message, "We could not send your enquiry. Please try again.");
      return true;
    });
  });
});
