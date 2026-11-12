import SwiftUI

struct CategoryProductsView: View {
    @EnvironmentObject private var router: Router
    @StateObject private var model: CategoryProductsViewModel

    @MainActor
    init(loadCategory: LoadCategoryUseCase, category: String) {
        _model = StateObject(wrappedValue: CategoryProductsViewModel(loadCategory: loadCategory, category: category))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                switch model.state {
                case .loading:
                    ProgressView("Loading products")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 32)
                case .failed(let message):
                    LoadFailure(message: message) { Task { await model.load() } }
                case .loaded:
                    if !model.topRated.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeading(title: "Top rated")
                            ProductGrid(products: model.topRated) { router.showProduct($0) }
                        }
                    }
                    if !model.additional.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeading(title: "More in this category")
                            ProductGrid(products: model.additional) { router.showProduct($0) }
                        }
                    }
                    if model.topRated.isEmpty && model.additional.isEmpty {
                        EmptyNote(title: "No products", message: "This category is empty.")
                    }
                }
            }
            .padding(16)
        }
        .background(Theme.canvas)
        .navigationTitle(ProductFormatting.categoryTitle(model.category))
        .navigationBarTitleDisplayMode(.inline)
        .task { await model.load() }
    }
}
