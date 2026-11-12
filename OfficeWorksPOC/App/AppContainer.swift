import Foundation

/// Composition root. Views never construct the HTTP client themselves.
struct AppContainer {
    private let repository: any CatalogueRepository

    init(repository: any CatalogueRepository) {
        self.repository = repository
    }

    static func live() -> AppContainer {
        AppContainer(repository: RemoteCatalogueRepository(baseURL: AppConfig.apiBaseURL))
    }

    var loadHome: LoadHomeUseCase { LoadHomeUseCase(repository: repository) }
    var loadCategory: LoadCategoryUseCase { LoadCategoryUseCase(repository: repository) }
    var search: SearchProductsUseCase { SearchProductsUseCase(repository: repository) }
    var submitEnquiry: SubmitEnquiryUseCase { SubmitEnquiryUseCase(repository: repository) }
}
