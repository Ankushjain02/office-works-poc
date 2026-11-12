import Foundation

struct ProductDTO: Decodable, Sendable {
    let id: Int
    let title: String
    let price: Double
    let description: String
    let category: String
    let imageUrl: URL
    let rating: Double
    let ratingCount: Int

    var product: Product {
        Product(
            id: id,
            title: title,
            price: price,
            description: description,
            category: category,
            imageUrl: imageUrl,
            rating: rating,
            ratingCount: ratingCount
        )
    }
}

struct ProductListDTO: Decodable {
    let products: [ProductDTO]
}

struct CategoryListDTO: Decodable {
    let categories: [String]
}

struct CategoryListingDTO: Decodable {
    let category: String
    let topRated: [ProductDTO]
    let additional: [ProductDTO]

    var listing: CategoryListing {
        CategoryListing(
            category: category,
            topRated: topRated.map(\.product),
            additional: additional.map(\.product)
        )
    }
}

struct SearchResultsDTO: Decodable {
    let query: String
    let products: [ProductDTO]
}

struct EnquiryRequestDTO: Encodable {
    let productId: Int
    let name: String
    let email: String
    let phone: String
    let message: String

    init(_ draft: EnquiryDraft) {
        productId = draft.productId
        name = draft.name
        email = draft.email
        phone = draft.phone
        message = draft.message
    }
}

struct EnquiryReceiptDTO: Decodable {
    let status: String
    let reference: String

    var receipt: EnquiryReceipt {
        EnquiryReceipt(status: status, reference: reference)
    }
}

struct APIErrorDTO: Decodable {
    struct Body: Decodable {
        let code: String
        let message: String
        let fields: [String: String]?
    }

    let error: Body
}
