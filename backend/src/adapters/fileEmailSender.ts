import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { sanitizeHeader } from "../domain/enquiry.js";
import { logger } from "../logger.js";
import type { EmailSender, OutboundEmail } from "../ports/emailSender.js";

export class FileEmailSender implements EmailSender {
  constructor(private readonly directory: string) {}

  async send(email: OutboundEmail): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    const safeName = email.reference.replace(/[^a-zA-Z0-9_-]/g, "") || "enquiry";
    const filePath = join(this.directory, `${safeName}.eml`);
    const content = [
      `To: ${sanitizeHeader(email.to)}`,
      `From: ${sanitizeHeader(email.from)}`,
      `Subject: ${sanitizeHeader(email.subject)}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${safeName}@catalogue.local>`,
      "",
      email.text,
      "",
    ].join("\r\n");
    await writeFile(filePath, content, "utf8");
    logger.info("enquiry email written", { reference: email.reference, to: email.to });
  }
}
