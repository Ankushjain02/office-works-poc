import Foundation

nonisolated enum CatalogueError: Error, Equatable {
    case invalidURL
    case decodingFailed
    case transport(String)
    case server(status: Int, message: String, fields: [String: String])
}

/// What the catalogue can do. Presentation depends on this, not on HTTP.
nonisolated protocol CatalogueRepository {
    func featuredProducts() async throws -> [Product]
    func categories() async throws -> [String]
    func products(in category: String) async throws -> CategoryListing
    func search(_ query: String) async throws -> [Product]
    func submitEnquiry(_ draft: EnquiryDraft) async throws -> EnquiryReceipt
}
