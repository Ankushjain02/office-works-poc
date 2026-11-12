import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseFeaturedProductIdList, readFeaturedProductIds } from "./domain/featured.js";
import { backendRoot } from "./paths.js";

export interface AppConfig {
  port: number;
  productSource: "fake-store" | "snapshot";
  productSourceUrl: string;
  snapshotPath: string;
  featuredProductIds: number[];
  cacheTtlMs: number;
  salesInbox: string;
  emailFrom: string;
  emailTransport: "file" | "smtp";
  smtpHost: string;
  smtpPort: number;
  outboxDir: string;
  enquiryRateLimit: number;
  enquiryRateWindowMs: number;
}

function loadEnvFile(): void {
  const path = resolve(backendRoot, ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function integer(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value)) throw new Error(`${name} must be an integer.`);
  return value;
}

function choice<T extends string>(name: string, allowed: readonly T[], fallback: T): T {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  if (allowed.includes(raw as T)) return raw as T;
  throw new Error(`${name} must be one of: ${allowed.join(", ")}.`);
}

export function loadConfig(): AppConfig {
  loadEnvFile();
  const featuredFromEnv = process.env.FEATURED_PRODUCT_IDS?.trim();
  const featuredFile = resolve(backendRoot, process.env.FEATURED_PRODUCTS_FILE ?? "config/featured-products.json");
  const featuredProductIds = featuredFromEnv
    ? parseFeaturedProductIdList(featuredFromEnv)
    : readFeaturedProductIds(JSON.parse(readFileSync(featuredFile, "utf8")));

  return {
    port: integer("PORT", 3000),
    productSource: choice("PRODUCT_SOURCE", ["fake-store", "snapshot"] as const, "fake-store"),
    productSourceUrl: process.env.PRODUCT_SOURCE_URL ?? "https://fakestoreapi.com",
    snapshotPath: resolve(backendRoot, process.env.SNAPSHOT_PATH ?? "data/products.snapshot.json"),
    featuredProductIds,
    cacheTtlMs: integer("CACHE_TTL_MS", 60_000),
    salesInbox: process.env.SALES_INBOX ?? "sales@example.com",
    emailFrom: process.env.EMAIL_FROM ?? "Catalogue <catalogue@localhost>",
    emailTransport: choice("EMAIL_TRANSPORT", ["file", "smtp"] as const, "file"),
    smtpHost: process.env.SMTP_HOST ?? "127.0.0.1",
    smtpPort: integer("SMTP_PORT", 1025),
    outboxDir: resolve(backendRoot, process.env.OUTBOX_DIR ?? "data/outbox"),
    enquiryRateLimit: integer("ENQUIRY_RATE_LIMIT", 10),
    enquiryRateWindowMs: integer("ENQUIRY_RATE_WINDOW_MS", 900_000),
  };
}
