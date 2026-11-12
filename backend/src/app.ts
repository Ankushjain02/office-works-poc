import express, {
  type ErrorRequestHandler,
  type Express,
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import { z } from "zod";
import { enquiryFieldErrors, enquirySchema } from "./domain/enquiry.js";
import { HttpError } from "./httpError.js";
import { logger } from "./logger.js";
import { CatalogueService } from "./services/catalogueService.js";
import { EnquiryService } from "./services/enquiryService.js";

export interface AppDependencies {
  catalogue: CatalogueService;
  enquiries: EnquiryService;
  rateLimit: { max: number; windowMs: number };
}

const searchQuery = z.object({
  q: z
    .string({ required_error: "Enter a search term.", invalid_type_error: "Enter a search term." })
    .trim()
    .min(1, "Enter a search term.")
    .max(100, "Search term is too long."),
});

function asyncHandler(handler: (req: Request, res: Response) => Promise<void>): RequestHandler {
  return (req, res, next) => {
    handler(req, res).catch(next);
  };
}

function rateLimit(max: number, windowMs: number): RequestHandler {
  const hits = new Map<string, number[]>();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip ?? "unknown";
    const recent = (hits.get(key) ?? []).filter((at) => now - at < windowMs);
    if (recent.length >= max) {
      res.setHeader("Retry-After", String(Math.ceil(windowMs / 1000)));
      res.status(429).json({
        error: { code: "RATE_LIMITED", message: "Too many enquiries. Try again shortly." },
      });
      return;
    }
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) hits.clear();
    next();
  };
}

function errorBody(error: HttpError): { error: { code: string; message: string; fields?: Record<string, string> } } {
  const body: { error: { code: string; message: string; fields?: Record<string, string> } } = {
    error: { code: error.code, message: error.message },
  };
  if (error.fields && Object.keys(error.fields).length > 0) {
    body.error.fields = error.fields;
  }
  return body;
}

export function createApp(deps: AppDependencies): Express {
  const app = express();
  app.disable("x-powered-by");
  // Ignore X-Forwarded-For so a client cannot reset the enquiry limit by spoofing it.
  app.set("trust proxy", false);
  app.use(express.json({ limit: "32kb" }));
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    next();
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get(
    "/api/products/featured",
    asyncHandler(async (_req, res) => {
      res.json({ products: await deps.catalogue.featured() });
    }),
  );

  app.get(
    "/api/categories",
    asyncHandler(async (_req, res) => {
      res.json({ categories: await deps.catalogue.categories() });
    }),
  );

  app.get(
    "/api/products/search",
    asyncHandler(async (req, res) => {
      const parsed = searchQuery.safeParse({ q: req.query.q });
      if (!parsed.success) {
        throw new HttpError(400, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Enter a search term.");
      }
      const products = await deps.catalogue.search(parsed.data.q);
      res.json({ query: parsed.data.q, products });
    }),
  );

  app.get(
    "/api/products/:id",
    asyncHandler(async (req, res) => {
      const rawId = req.params.id;
      if (typeof rawId !== "string" || !/^[0-9]+$/.test(rawId)) {
        throw new HttpError(400, "VALIDATION_ERROR", "Product id must be a positive integer.");
      }
      const product = await deps.catalogue.byId(Number(rawId));
      if (!product) throw new HttpError(404, "NOT_FOUND", "Product not found.");
      res.json(product);
    }),
  );

  app.get(
    "/api/products",
    asyncHandler(async (req, res) => {
      const category = req.query.category;
      if (typeof category !== "string" || category.trim() === "") {
        throw new HttpError(400, "VALIDATION_ERROR", "Provide a category.");
      }
      const listing = await deps.catalogue.byCategory(category);
      if (!listing) throw new HttpError(404, "NOT_FOUND", "Unknown category.");
      res.json(listing);
    }),
  );

  app.post(
    "/api/enquiries",
    rateLimit(deps.rateLimit.max, deps.rateLimit.windowMs),
    asyncHandler(async (req, res) => {
      const parsed = enquirySchema.safeParse(req.body);
      if (!parsed.success) {
        throw new HttpError(400, "VALIDATION_ERROR", "Check the form and try again.", enquiryFieldErrors(parsed.error));
      }
      const result = await deps.enquiries.submit(parsed.data);
      res.status(201).json({ status: "accepted", reference: result.reference });
    }),
  );

  app.use((_req, res) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Not found." } });
  });

  const handleError: ErrorRequestHandler = (error: unknown, _req, res, _next: NextFunction) => {
    if (error instanceof HttpError) {
      res.status(error.status).json(errorBody(error));
      return;
    }
    if (error instanceof SyntaxError && "status" in error && error.status === 400) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Request body must be JSON." } });
      return;
    }
    logger.error("unhandled request error", { error: error instanceof Error ? error.message : "unknown" });
    res.status(500).json({ error: { code: "INTERNAL", message: "Something went wrong." } });
  };
  app.use(handleError);
  return app;
}
