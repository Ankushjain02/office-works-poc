import Foundation

struct HomeContent: Equatable, Sendable {
    let products: [Product]
    let categories: [String]
}

struct LoadHomeUseCase {
    private let repository: any CatalogueRepository

    init(repository: any CatalogueRepository) {
        self.repository = repository
    }

    func execute() async throws -> HomeContent {
        async let products = repository.featuredProducts()
        async let categories = repository.categories()
        return try await HomeContent(products: products, categories: categories)
    }
}

struct LoadCategoryUseCase {
    private let repository: any CatalogueRepository

    init(repository: any CatalogueRepository) {
        self.repository = repository
    }

    func execute(category: String) async throws -> CategoryListing {
        try await repository.products(in: category)
    }
}

struct SearchProductsUseCase {
    private let repository: any CatalogueRepository

    init(repository: any CatalogueRepository) {
        self.repository = repository
    }

    func execute(query: String) async throws -> [Product] {
        try await repository.search(query)
    }
}

struct SubmitEnquiryUseCase {
    private let repository: any CatalogueRepository

    init(repository: any CatalogueRepository) {
        self.repository = repository
    }

    func execute(_ draft: EnquiryDraft) async throws -> EnquiryReceipt {
        try await repository.submitEnquiry(draft)
    }
}
