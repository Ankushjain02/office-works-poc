import SwiftUI

struct ProductDetailView: View {
    @EnvironmentObject private var router: Router
    @StateObject private var model: ProductDetailViewModel
    @State private var showingEnquiry = false

    private let submitEnquiry: SubmitEnquiryUseCase

    @MainActor
    init(product: Product, submitEnquiry: SubmitEnquiryUseCase) {
        self.submitEnquiry = submitEnquiry
        _model = StateObject(wrappedValue: ProductDetailViewModel(product: product))
    }

    var body: some View {
        detail(model.product)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Theme.canvas)
            .navigationTitle(model.product.title)
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $showingEnquiry) {
                EnquiryFormView(submitEnquiry: submitEnquiry, product: model.product)
            }
    }

    private func detail(_ product: Product) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                ProductImage(url: product.imageUrl, height: 280)

                VStack(alignment: .leading, spacing: 8) {
                    Text(ProductFormatting.price(product.price))
                        .font(.title2.weight(.semibold))
                    Text(ProductFormatting.rating(product.rating, count: product.ratingCount))
                        .foregroundStyle(Theme.muted)
                    Button(ProductFormatting.categoryTitle(product.category)) {
                        router.showCategory(product.category)
                    }
                    .buttonStyle(.bordered)
                    .tint(Theme.accent)
                }

                Text(product.description)
                    .foregroundStyle(Theme.ink)
                    .textSelection(.enabled)
            }
            .padding(16)
        }
        .safeAreaInset(edge: .bottom) {
            Button("Enquire") { showingEnquiry = true }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .frame(maxWidth: .infinity)
                .padding(16)
                .background(Theme.canvas)
                .accessibilityIdentifier("enquireButton")
        }
    }
}
