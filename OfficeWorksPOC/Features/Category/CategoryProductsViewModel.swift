import Combine

final class CategoryProductsViewModel: ObservableObject {
    let category: String
    @Published private(set) var topRated: [Product] = []
    @Published private(set) var additional: [Product] = []
    @Published private(set) var state: ScreenState = .loading

    private let loadCategory: LoadCategoryUseCase

    init(loadCategory: LoadCategoryUseCase, category: String) {
        self.loadCategory = loadCategory
        self.category = category
    }

    func load() async {
        let hasContent = !topRated.isEmpty || !additional.isEmpty
        if !hasContent { state = .loading }
        do {
            let listing = try await loadCategory.execute(category: category)
            topRated = listing.topRated
            additional = listing.additional
            state = .loaded
        } catch {
            if !hasContent {
                state = .failed(ErrorMessage.describe(error))
            }
        }
    }
}
