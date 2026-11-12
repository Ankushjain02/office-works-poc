import Foundation

nonisolated struct Product: Identifiable, Equatable, Hashable, Sendable {
    let id: Int
    let title: String
    let price: Double
    let description: String
    let category: String
    let imageUrl: URL
    let rating: Double
    let ratingCount: Int
}

nonisolated struct CategoryListing: Equatable, Sendable {
    let category: String
    let topRated: [Product]
    let additional: [Product]
}
