import Foundation
@testable import OfficeWorksPOC

enum SampleProduct {
    static func make(
        id: Int = 1,
        title: String = "Backpack",
        price: Double = 109.95,
        description: String = "A pack",
        category: String = "men's clothing",
        rating: Double = 3.9,
        ratingCount: Int = 120
    ) -> Product {
        Product(
            id: id,
            title: title,
            price: price,
            description: description,
            category: category,
            imageUrl: URL(string: "https://example.com/\(id).png")!,
            rating: rating,
            ratingCount: ratingCount
        )
    }
}

final class MockCatalogueRepository: CatalogueRepository {
    var featuredResult: Result<[Product], Error> = .success([])
    var categoriesResult: Result<[String], Error> = .success([])
    var listingResult = Result<CategoryListing, Error>.success(
        CategoryListing(category: "electronics", topRated: [], additional: [])
    )
    var searchResult: Result<[Product], Error> = .success([])
    var enquiryResult: Result<EnquiryReceipt, Error> = .success(
        EnquiryReceipt(status: "accepted", reference: "enq_test")
    )

    private(set) var searchCalls: [String] = []
    private(set) var categoryCalls: [String] = []
    private(set) var enquiryCalls: [EnquiryDraft] = []

    func featuredProducts() async throws -> [Product] {
        try featuredResult.get()
    }

    func categories() async throws -> [String] {
        try categoriesResult.get()
    }

    func products(in category: String) async throws -> CategoryListing {
        categoryCalls.append(category)
        return try listingResult.get()
    }

    func search(_ query: String) async throws -> [Product] {
        searchCalls.append(query)
        return try searchResult.get()
    }

    func submitEnquiry(_ draft: EnquiryDraft) async throws -> EnquiryReceipt {
        enquiryCalls.append(draft)
        return try enquiryResult.get()
    }
}
