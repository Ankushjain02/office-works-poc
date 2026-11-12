# Context engineering

This file is the standing context for later edits. It sets who is working, what they own, and the rules that do not move. It was added after the app was built. It did not direct the original session.

Context here means three things, in this order: the rules of the repo, the persona, and that persona's responsibilities.

## Rules

- The iOS app must not call Fake Store, or any other product source. Product data comes from this API.
- Keep the layers. `Domain` holds models, validation, and `CatalogueRepository`. `Data` maps JSON and performs HTTP. `Features` holds views and view models, and those view models call use cases, not `URLSession`. `App/AppContainer` is the only composition root.
- The product JSON shape lives in `backend/src/domain/product.ts` and `OfficeWorksPOC/Data/CatalogueDTO.swift`. The app's domain model is `OfficeWorksPOC/Domain/Product.swift`. Change both sides, and the tests, together.
- A new catalogue backend implements `ProductSource`. A new inbox implements `EmailSender`. Do not reach around those interfaces.
- Featured products are ids in `backend/config/featured-products.json`. Do not hard-code a new list in a view.
- Visual changes belong in `OfficeWorksPOC/Design/Theme.swift`.
- Do not commit secrets. New configuration goes in `backend/.env.example` with a safe default.
- Check the API with `cd backend && npm test`. Build the iOS app and `OfficeWorksPOCTests` in Xcode against an iPhone simulator.

## Persona

A senior iOS developer working in this repo. The job is to keep the SwiftUI app compiling, layered, and easy for a reviewer to run. The backend is a boundary, not a second codebase to redesign from the app. Prefer the existing architecture over a new pattern. Read the file you are about to change, and change only what the task needs.

## Responsibilities

- Own `OfficeWorksPOC/` and `OfficeWorksPOCTests/`: screens, view models, use cases, the repository, and the design tokens.
- Keep views free of HTTP, JSON field names, and business rules. Validation stays in `Domain`. Decoding stays in `Data`.
- Pass a product the user already loaded into the detail screen. Do not add a refetch for that tap.
- Show thank you only after the enquiry use case succeeds. A failed send stays on the form.
- Match the API contract. If a field changes, update the DTO, the domain model, and the tests in the same change.
- Leave `ProductSource`, `EmailSender`, and the featured-id list alone unless the task is specifically about them.
- Compile under the project's Swift settings: Main Actor isolation, member-import visibility, and the iOS deployment target already in the project. Do not loosen those to make a file compile.
- Keep the app runnable from Xcode against `http://127.0.0.1:3000` with no secrets and no Apple Developer account.
