import SwiftUI

struct RootView: View {
    private let container: AppContainer
    @StateObject private var router = Router()

    init(container: AppContainer) {
        self.container = container
    }

    var body: some View {
        NavigationStack(path: $router.path) {
            HomeView(loadHome: container.loadHome)
                .navigationDestination(for: Route.self) { route in
                    switch route {
                    case .category(let name):
                        CategoryProductsView(loadCategory: container.loadCategory, category: name)
                    case .search(let query):
                        SearchResultsView(search: container.search, query: query)
                    case .product(let product):
                        ProductDetailView(product: product, submitEnquiry: container.submitEnquiry)
                    }
                }
        }
        .environmentObject(router)
        .tint(Theme.accent)
        .preferredColorScheme(.light)
    }
}
