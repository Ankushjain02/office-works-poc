import SwiftUI

struct SearchResultsView: View {
    @EnvironmentObject private var router: Router
    @StateObject private var model: SearchViewModel

    @MainActor
    init(search: SearchProductsUseCase, query: String) {
        _model = StateObject(wrappedValue: SearchViewModel(search: search, query: query))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                switch model.state {
                case .loading:
                    ProgressView("Searching")
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 32)
                case .failed(let message):
                    LoadFailure(message: message) { Task { await model.load() } }
                case .loaded where model.products.isEmpty:
                    EmptyNote(
                        title: "No matches",
                        message: "Nothing matches “\(model.query)”."
                    )
                case .loaded:
                    ProductGrid(products: model.products) { router.showProduct($0) }
                }
            }
            .padding(16)
        }
        .background(Theme.canvas)
        .navigationTitle("Results")
        .navigationBarTitleDisplayMode(.inline)
        .task { await model.load() }
    }
}
