import Combine

final class HomeViewModel: ObservableObject {
    @Published private(set) var products: [Product] = []
    @Published private(set) var categories: [String] = []
    @Published private(set) var state: ScreenState = .loading
    @Published var searchText = ""
    @Published private(set) var searchValidation: String?
    @Published private(set) var banner: String?

    private let loadHome: LoadHomeUseCase

    init(loadHome: LoadHomeUseCase) {
        self.loadHome = loadHome
    }

    func load() async {
        let hasContent = !products.isEmpty
        if !hasContent { state = .loading }
        banner = nil
        do {
            let content = try await loadHome.execute()
            products = content.products
            categories = content.categories
            state = .loaded
        } catch {
            let message = ErrorMessage.describe(error)
            if hasContent {
                banner = message
                state = .loaded
            } else {
                state = .failed(message)
            }
        }
    }

    /// Returns the term to search for. The search request happens only after this succeeds.
    func submitSearch() -> String? {
        switch SearchQuery.accepted(from: searchText) {
        case .success(let query):
            searchValidation = nil
            return query
        case .failure(let rejection):
            searchValidation = rejection.message
            return nil
        }
    }
}
