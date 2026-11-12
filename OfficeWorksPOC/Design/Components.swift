import SwiftUI

struct ProductTile: View {
    let product: Product
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 10) {
                ProductImage(url: product.imageUrl, height: 120)
                Text(product.title)
                    .font(.system(.subheadline, design: .serif))
                    .foregroundStyle(Theme.ink)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                Text(ProductFormatting.price(product.price))
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Theme.ink)
                Text(ProductFormatting.rating(product.rating, count: product.ratingCount))
                    .font(.caption)
                    .foregroundStyle(Theme.muted)
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.card)
            .clipShape(RoundedRectangle(cornerRadius: Theme.radius))
            .overlay {
                RoundedRectangle(cornerRadius: Theme.radius)
                    .stroke(Theme.line, lineWidth: 1)
            }
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("productTile-\(product.id)")
        .accessibilityLabel("\(product.title), \(ProductFormatting.price(product.price))")
        .accessibilityHint("Shows product details")
    }

}

struct ProductImage: View {
    let url: URL
    var height: CGFloat

    var body: some View {
        AsyncImage(url: url) { phase in
            switch phase {
            case .success(let image):
                image.resizable().scaledToFit()
            default:
                Image(systemName: "photo")
                    .font(.title2)
                    .foregroundStyle(Theme.muted)
            }
        }
        .frame(maxWidth: .infinity)
        .frame(height: height)
        .background(Theme.card)
    }
}

struct SearchBar: View {
    @Binding var text: String
    var validation: String?
    var onSearch: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                TextField("Search products", text: $text)
                    .textFieldStyle(.plain)
                    .submitLabel(.search)
                    .onSubmit(onSearch)
                    .accessibilityIdentifier("searchField")
                Button("Search", action: onSearch)
                    .buttonStyle(.borderedProminent)
                    .accessibilityIdentifier("searchButton")
            }
            .padding(12)
            .background(Theme.card)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay {
                RoundedRectangle(cornerRadius: 12).stroke(Theme.line, lineWidth: 1)
            }
            if let validation {
                Text(validation)
                    .font(.footnote)
                    .foregroundStyle(Theme.danger)
                    .accessibilityIdentifier("searchValidation")
            }
        }
    }
}

struct SectionHeading: View {
    let title: String

    var body: some View {
        Text(title)
            .font(.system(.title2, design: .serif))
            .foregroundStyle(Theme.ink)
    }
}

struct LoadFailure: View {
    let message: String
    let retry: () -> Void

    var body: some View {
        VStack(spacing: 12) {
            Text("Something went wrong")
                .font(.headline)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(Theme.muted)
                .multilineTextAlignment(.center)
            Button("Try again", action: retry)
                .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 32)
    }
}

struct EmptyNote: View {
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 8) {
            Text(title).font(.headline)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(Theme.muted)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 32)
    }
}

struct ProductGrid: View {
    let products: [Product]
    let onSelect: (Product) -> Void

    private let columns = [GridItem(.adaptive(minimum: 160), spacing: 12)]

    var body: some View {
        LazyVGrid(columns: columns, spacing: 12) {
            ForEach(products) { product in
                ProductTile(product: product) { onSelect(product) }
            }
        }
    }
}
