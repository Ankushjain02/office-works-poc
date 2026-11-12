import { FallbackProductSource } from "./adapters/fallbackProductSource.js";
import { FakeStoreProductSource } from "./adapters/fakeStoreProductSource.js";
import { FileEmailSender } from "./adapters/fileEmailSender.js";
import { SmtpEmailSender } from "./adapters/smtpEmailSender.js";
import { SnapshotProductSource } from "./adapters/snapshotProductSource.js";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { logger } from "./logger.js";
import type { EmailSender } from "./ports/emailSender.js";
import type { ProductSource } from "./ports/productSource.js";
import { CatalogueService } from "./services/catalogueService.js";
import { EnquiryService } from "./services/enquiryService.js";

const config = loadConfig();
const snapshot = new SnapshotProductSource(config.snapshotPath);
const products: ProductSource =
  config.productSource === "snapshot"
    ? snapshot
    : new FallbackProductSource(new FakeStoreProductSource(config.productSourceUrl), snapshot);

const catalogue = new CatalogueService(products, config.featuredProductIds, config.cacheTtlMs);
const email: EmailSender =
  config.emailTransport === "smtp"
    ? new SmtpEmailSender({ host: config.smtpHost, port: config.smtpPort })
    : new FileEmailSender(config.outboxDir);

const app = createApp({
  catalogue,
  enquiries: new EnquiryService(catalogue, email, config.salesInbox, config.emailFrom),
  rateLimit: { max: config.enquiryRateLimit, windowMs: config.enquiryRateWindowMs },
});

const server = app.listen(config.port, "0.0.0.0", () => {
  logger.info("catalogue api listening", {
    port: config.port,
    productSource: config.productSource,
    emailTransport: config.emailTransport,
  });
});

function shutdown(): void {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
