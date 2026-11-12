import Combine

final class SearchViewModel: ObservableObject {
    let query: String
    @Published private(set) var products: [Product] = []
    @Published private(set) var state: ScreenState = .loading

    private let search: SearchProductsUseCase

    init(search: SearchProductsUseCase, query: String) {
        self.search = search
        self.query = query
    }

    func load() async {
        let hasContent = !products.isEmpty
        if !hasContent { state = .loading }
        do {
            products = try await search.execute(query: query)
            state = .loaded
        } catch {
            if !hasContent {
                state = .failed(ErrorMessage.describe(error))
            }
        }
    }
}
