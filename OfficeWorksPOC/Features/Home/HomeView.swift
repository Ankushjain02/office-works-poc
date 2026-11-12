import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var router: Router
    @StateObject private var model: HomeViewModel

    @MainActor
    init(loadHome: LoadHomeUseCase) {
        _model = StateObject(wrappedValue: HomeViewModel(loadHome: loadHome))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                SearchBar(text: $model.searchText, validation: model.searchValidation) {
                    if let query = model.submitSearch() {
                        router.showSearch(query)
                    }
                }

                if let banner = model.banner {
                    Text(banner)
                        .font(.footnote)
                        .foregroundStyle(Theme.danger)
                }

                switch model.state {
                case .loading:
                    ProgressView("Loading products")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 32)
                case .failed(let message):
                    LoadFailure(message: message) { Task { await model.load() } }
                case .loaded:
                    if !model.categories.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeading(title: "Categories")
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(model.categories, id: \.self) { category in
                                        Button(ProductFormatting.categoryTitle(category)) {
                                            router.showCategory(category)
                                        }
                                        .buttonStyle(.bordered)
                                        .tint(Theme.accent)
                                        .accessibilityIdentifier("category-\(category)")
                                    }
                                }
                            }
                        }
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        SectionHeading(title: "Top rated")
                        if model.products.isEmpty {
                            EmptyNote(
                                title: "No top rated products",
                                message: "The featured list is empty."
                            )
                        } else {
                            ProductGrid(products: model.products) { product in
                                router.showProduct(product)
                            }
                            .accessibilityIdentifier("featuredProducts")
                        }
                    }
                }
            }
            .padding(16)
        }
        .background(Theme.canvas)
        .navigationTitle("Catalogue")
        .refreshable { await model.load() }
        .task { await model.load() }
    }
}
