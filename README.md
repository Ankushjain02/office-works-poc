# Catalogue proof of concept

A small product catalogue: an iOS app for browsing, and a Node API that owns the product data and the enquiry email. The app never calls the product source itself.

## Stack

iOS app in SwiftUI, API in Node.js and TypeScript.

The repo already had an Xcode 26 SwiftUI app, and the brief asks for one iOS client. Node is the smaller backend to run and to put in a container: one process, a built-in test runner, and no PHP runtime. The product source and the email sender are interfaces, so neither choice is stuck to Fake Store or to a particular inbox. Laravel would have been a fair alternative; it is a larger thing for a reviewer to boot for this scope.

## Run the API

Requires Node.js 22 or newer. From the repository root:

```bash
cd backend
npm install
npm test
npm run dev
```

The API listens on port 3000. With no `.env` file it reads the committed product snapshot if Fake Store cannot be reached, and it writes enquiry emails to `backend/data/outbox/` as `.eml` files. That folder is the local sales inbox.

Optional overrides live in `backend/.env.example`. Copy it to `backend/.env` only if you want to change them.

### Docker, with a real inbox UI

Requires Docker. From the repository root:

```bash
docker compose up --build
```

The API is still on port 3000. Enquiry email is delivered to Mailpit. Open http://localhost:8025 to read the sales inbox. Mailpit is only for local review. The API talks to it through SMTP, which is the same shape as Amazon SES later.

## Run the iOS app

Requires Xcode 26.6 or newer. The project targets the iOS 26.5 simulator.

1. Start the API first.
2. Open `OfficeWorksPOC.xcodeproj`.
3. Select an iPhone simulator and press Run.

The app is named Catalogue on the home screen. It calls `http://127.0.0.1:3000`, which the simulator can reach on the host. That address is `APIBaseURL` in `OfficeWorksPOC-Info.plist`. A scheme environment variable named `API_BASE_URL` overrides it.

The project is signed ad hoc, so a simulator run does not need an Apple Developer account. A physical device would need a team, and it would also need the Mac's LAN address in `APIBaseURL`, because a device cannot use `127.0.0.1` to reach the host.

If Xcode says the iOS platform or simulator runtime is missing, install it from Xcode Settings, Components. The app and its unit tests compile against the simulator SDK without a booted simulator:

```bash
xcodebuild -project OfficeWorksPOC.xcodeproj -target OfficeWorksPOC -sdk iphonesimulator -configuration Debug build CODE_SIGNING_ALLOWED=NO
xcodebuild -project OfficeWorksPOC.xcodeproj -target OfficeWorksPOCTests -sdk iphonesimulator -configuration Debug build CODE_SIGNING_ALLOWED=NO
```

## Try the acceptance criteria

1. Home shows five featured products, in the order in `backend/config/featured-products.json` (ids 1, 5, 9, 15, 11).
2. Tap a category. The screen has a Top rated section and a More in this category section.
3. On the home screen, type `jacket` and press Search. Only matching products are shown. The search runs when the button is pressed, not on each keystroke. The keyboard Search key does the same thing.
4. Tap a product tile to open its details.
5. Tap Enquire, enter a name, email, and phone, and press Send enquiry. The form then shows Thank you, and the sales inbox receives the email. With `npm run dev`, look in `backend/data/outbox/`. With Docker, look in Mailpit.

An invalid email stays on the form and does not send anything.

## Tests

```bash
cd backend && npm test
```

The API tests cover featured order, the category split, literal search, the snapshot contract, enquiry validation, the sales email, and the HTTP status codes. They do not call Fake Store.

The iOS tests are in `OfficeWorksPOCTests`. They cover decoding, featured loading, search-on-submit, the category split on the client, and the enquiry form's thank-you and failure paths. Run them from Xcode on an iPhone simulator. This machine had no simulator runtime installed, so they were compiled with the commands above and not executed here.

## Where the decisions are

- [DECISIONS.md](DECISIONS.md) covers assumptions, cuts, and how this can grow.
- [AI_USAGE.md](AI_USAGE.md) covers the tools, the prompts that mattered, and the mistakes that were caught.
- [AGENTS.md](AGENTS.md) is the context for later edits: the repo rules, a senior iOS persona, and that persona's responsibilities. It was written after the app was built.
