import { randomUUID } from "node:crypto";
import { renderEnquiry, sanitizeHeader, type EnquiryInput } from "../domain/enquiry.js";
import { HttpError } from "../httpError.js";
import { logger } from "../logger.js";
import type { EmailSender } from "../ports/emailSender.js";
import { CatalogueService } from "./catalogueService.js";

export class EnquiryService {
  constructor(
    private readonly catalogue: CatalogueService,
    private readonly email: EmailSender,
    private readonly salesInbox: string,
    private readonly fromAddress: string,
    private readonly nextReference: () => string = () => `enq_${randomUUID()}`,
  ) {}

  async submit(input: EnquiryInput): Promise<{ reference: string }> {
    const product = await this.catalogue.byId(input.productId);
    if (!product) {
      throw new HttpError(404, "NOT_FOUND", "That product is no longer available.");
    }

    const reference = this.nextReference();
    const subject = `Enquiry: ${sanitizeHeader(product.title)}`;
    try {
      await this.email.send({
        to: this.salesInbox,
        from: this.fromAddress,
        subject,
        text: renderEnquiry({
          reference,
          product,
          name: input.name,
          email: input.email,
          phone: input.phone,
          message: input.message,
        }),
        reference,
      });
    } catch (error) {
      logger.error("enquiry email failed", {
        reference,
        productId: product.id,
        error: error instanceof Error ? error.message : "unknown",
      });
      throw new HttpError(503, "EMAIL_FAILED", "We could not send your enquiry. Please try again.");
    }

    logger.info("enquiry accepted", { reference, productId: product.id });
    return { reference };
  }
}
