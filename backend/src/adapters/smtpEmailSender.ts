import nodemailer from "nodemailer";
import type { EmailSender, OutboundEmail } from "../ports/emailSender.js";

export class SmtpEmailSender implements EmailSender {
  private readonly transport: nodemailer.Transporter;

  constructor(options: { host: string; port: number }) {
    this.transport = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: false,
    });
  }

  async send(email: OutboundEmail): Promise<void> {
    await this.transport.sendMail({
      to: email.to,
      from: email.from,
      subject: email.subject,
      text: email.text,
    });
  }
}
