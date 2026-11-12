# AI usage

The work was done in Cursor, with the agent running Grok 4.7. I did not use a separate chat, a second model, or a written spec file. The brief was the spec. The plan was to keep the generated Xcode app, put a typed API in front of Fake Store, and make the product source, the inbox, and the visual tokens replaceable.

There was no `CLAUDE.md`, `AGENTS.md`, or `.cursor/rules` at the start. `AGENTS.md` was added at the end as context for later edits. It did not direct this session.

That context is written in three parts. The rules say what must not change: the app never calls Fake Store, the layers stay separate, and the product JSON has one shape. The persona is a senior iOS developer who keeps the SwiftUI app compiling and does not redesign the API from the client. The responsibilities say what that person owns: the app and its tests, validation in `Domain`, decoding in `Data`, and a thank-you screen only after the email send succeeds.

## Moments that shaped the result

1. **Keep the snapshot's product shape.** `backend/data/products.snapshot.json` was already mapped off Fake Store, with `imageUrl` and a flat `rating`. The API and the Swift model follow that file. The app does not decode Fake Store's `image` and `rating.rate` fields. That kept one contract instead of two.

2. **Top rated is a chosen list.** The home scenario says the five products were chosen. Featured order is the order in `config/featured-products.json`, and a category's top rated section is the chosen products in that category. The rating number is displayed and is not the sort key. The tests lock the order: a higher-rated product does not jump the queue.

3. **Two ports, and nothing else talks to the outside.** `ProductSource` and `EmailSender` are the extension points named in the brief. The catalogue rules are pure functions in front of the source, so Fake Store's own search endpoint is not part of the design. The iOS app only has `CatalogueAPI`.

4. **The inbox had to be real without an account.** The first cut was SMTP only. That fails the "no accounts, and it has to run" rule if Mailpit is not up. The file sender writes an `.eml` the reviewer can open, and Docker turns on SMTP against Mailpit. The thank-you screen waits for `send` to resolve in both cases.

5. **Build the app that was already here.** The project was an Xcode 26 multiplatform shell with Main Actor isolation and member-import visibility turned on. The app was narrowed to iPhone and iPad, signed ad hoc so a simulator run needs no Apple team, and the new code had to compile under those Swift settings rather than a looser setup.

## What was wrong, and how it was caught

- `tsconfig.json` used `forceConsistentCasingInFileSystem`. That flag does not exist. `tsc` said the real name is `forceConsistentCasingInFileNames`.
- `AddressInfo` was imported from `node:http`. Typecheck failed. It comes from `node:net`.
- With `noUncheckedIndexedAccess`, `req.params.id` is `string | undefined`. The route was passing it straight into a function that wants `string`. Typecheck failed, and the route now rejects a missing id.
- The enquiry view model called `trimmingCharacters(in:)` with only `import Combine`. Member import visibility does not re-export Foundation. `xcodebuild` failed on that file. Adding `import Foundation` fixed it.
- `xcodebuild -destination 'generic/platform=iOS Simulator'` could not find a destination, because no simulator runtime is installed. The simulator SDK is installed. Building with `-sdk iphonesimulator` compiled the app and the test bundle. Both reported `BUILD SUCCEEDED`.
- A skipped Fake Store row logged the entire Zod issue tree. The test run printed a page of JSON for one bad fixture. The log is now a single warning. The row is still skipped.
- The first HTTP fixture expected featured ids `[1, 5, 9]` from a configured list of `[1, 5, 9, 15, 11]`. Id 15 is not in that small fixture, and id 11 is. The assertion was corrected to `[1, 5, 9, 11]` before the suite ran. The first run passed 25 tests. A unicode-name case was added after that, and the suite passed again at 26.
- Image URLs in the snapshot contain `+`, which is legal in a URL path and is rejected by some URL validators. The schema uses the platform URL parser, and a test loads product 11 from the snapshot and checks the plus sign survives.

`npm test` and `npm run typecheck` passed after those fixes. The iOS unit tests compile. They were not executed, because there is no simulator runtime on this machine.
