# Decisions and assumptions

## Why this shape

The brief asks for a proof of concept that is not thrown away. Three things are expected to change: the product data, the look and feel, and the email provider. Each of those is a seam.

- `ProductSource` is the only way into the catalogue. `FakeStoreProductSource` knows Fake Store's JSON. `SnapshotProductSource` reads the committed file. The iOS app knows neither.
- `EmailSender` is the only way out to an inbox. `FileEmailSender` writes `.eml` files. `SmtpEmailSender` talks SMTP. Amazon SES is another implementation of the same interface, not a rewrite.
- `Theme.swift` holds the colours and the type. Screens ask for those tokens. A new brand replaces that file.
- On iOS, views and view models live in `Features` and call use cases. Use cases talk to `CatalogueRepository`. Only `Data/RemoteCatalogueRepository` knows the HTTP paths and the JSON field names. `App/AppContainer` wires the live repository in. A product tile passes the product you already loaded into the detail screen, so that tap does not make another request.
- The five featured products are data, in `backend/config/featured-products.json`, not a code change. `FEATURED_PRODUCT_IDS` overrides the file when it is set.
- The API base URL is `APIBaseURL` in the Info.plist, overridable with `API_BASE_URL`.

The HTTP API does not pass Fake Store's field names through. The app sees `imageUrl`, `rating`, and `ratingCount`. A future catalogue can change upstream without a client release, as long as this JSON stays stable.

Filtering lives in `catalogueRules.ts`, not in the source. Fake Store's search and category endpoints are unused on purpose. A source only has to return products. When the catalogue is too big to load in one list, the port grows query methods and these rules move behind it. The screens stay the same.

The API process is stateless aside from a one-minute in-memory product cache and an in-memory enquiry rate limit. That is a single container, which is a fit for App Runner or ECS. The cache and the limit would move to a shared store before running more than one instance. `trust proxy` is off, so a client cannot reset the limit by sending `X-Forwarded-For`. Turn that on only behind a known load balancer.

## Assumptions

The acceptance criteria leave these open. This is the reading I built.

**"Top rated" means chosen, not sorted by the rating field.** The home scenario says the five products were chosen. The category page says "top rated products for that category", which I read as the chosen products that sit in that category, in the chosen order. Everything else in the category is "additional", sorted by title so the order is stable. The rating is still shown on the tile. It does not decide membership.

The default five ids are 1, 5, 9, 15, and 11. They cover men's clothing, jewellery, electronics, and women's clothing, and electronics has two, so every category page shows both sections. If a chosen id is missing from the source, it is left out and logged. The page still loads.

**Categories** come from the product list and are listed A to Z. There is no merchandised category order yet. The source spells the jewellery category `jewelery`. The UI shows Jewellery. The value sent back to the API is still the source string.

**Search** is literal, case-insensitive, and runs on the server against title, then category, then description. A title match ranks above a description match. Characters such as `(` and `.*` are not regular expressions. Empty and whitespace-only terms are rejected. The home screen owns the search field. The keyboard Search key submits the same way as the Search button.

**The enquiry form** asks for name, email, and phone, plus an optional message. Name is 2 to 80 characters, letters with spaces, apostrophes, hyphens, and periods, including non-Latin letters. Email is a straightforward address, max 254 characters. Phone is 8 to 15 digits, with `+`, spaces, brackets, dots, and hyphens allowed. The same rules are checked in the app and again in the API. The API is the one that matters.

**Thank you is shown only after the email send succeeds.** A validation error stays on the form. If the inbox cannot be reached, the API returns 503 and the form shows the error, not thank you. The email is plain text. The product title is stripped of newlines before it is placed in the subject, so a title cannot add another header.

**Prices are US dollars**, which is what Fake Store publishes. The app formats them in `en_US` so the symbol does not depend on the phone's region.

**The palette is light only** until there is a designed dark mode. `preferredColorScheme(.light)` keeps the paper background from being inverted by the system.

**Product data.** The default source is the live Fake Store API. If that request fails, the API logs a warning and serves `backend/data/products.snapshot.json` for that call. The result is cached for 60 seconds, then the live source is tried again. Set `PRODUCT_SOURCE=snapshot` to skip the network. The snapshot is also what the tests assert against, so a change to the five featured ids has to keep every category showing both sections.

**The local sales inbox is a real email, not a log line.** `EMAIL_TRANSPORT=file` writes an `.eml` file. `EMAIL_TRANSPORT=smtp` sends it. Docker uses SMTP and Mailpit. Neither needs an account.

## What was left out

- **Pagination.** The source has 20 products. The rules are written so a later source can page, but the screens do not.
- **Accounts, payments, and a database of enquiries.** The acceptance criteria stop at the email. The email is the record for this proof of concept.
- **An OpenAPI document and a generated Swift client.** The JSON shapes are small and covered by tests on both sides. Generating them is the first thing to do once the contract starts moving. See below.
- **UI tests on the simulator.** The critical path is in view models, with a fake API. A UI test needs a booted simulator and a running API. This machine had no simulator runtime, so those tests were not added.
- **Calling Fake Store from the test suite.** The mapper is tested with a stub response. A live call would make `npm test` depend on a third party being up.

## What another day would be for

1. Publish an OpenAPI document and generate the Swift client, so the two sides cannot drift.
2. Store the enquiry as well as emailing it, on Postgres, and send through SES in deployed environments. Keep `EmailSender` as the port.
3. Widen `ProductSource` with search and category queries so a real catalogue does not load every product into the process.
4. Add a merchandising order for categories, the same way featured products are already a config file.
5. Add one simulator UI test: search, open a product, submit an enquiry, see Thank you.
6. Replace `Theme.swift` with the creative team's tokens when they arrive.

## Time spent

This is the wall-clock of the Cursor session on 11 November 2026 that produced the repository. Replace it with your own time if you spent longer reviewing it before you submit. The review asks for your time.

| Activity | Time |
| --- | --- |
| Planning, including reading the brief and the existing project | 10 minutes |
| Building the API, the app, and the project wiring | 30 minutes |
| Tests, typecheck, and the iOS compile fixes | 15 minutes |
| Writing the decision and AI notes | 10 minutes |
| Total | about 1 hour |
