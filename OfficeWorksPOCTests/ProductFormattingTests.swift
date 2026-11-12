import XCTest
@testable import OfficeWorksPOC

final class ProductFormattingTests: XCTestCase {
    func testPriceUsesUSDollars() {
        XCTAssertEqual(ProductFormatting.price(109.95), "$109.95")
        XCTAssertEqual(ProductFormatting.price(695), "$695.00")
    }

    func testCategoryTitles() {
        XCTAssertEqual(ProductFormatting.categoryTitle("jewelery"), "Jewellery")
        XCTAssertEqual(ProductFormatting.categoryTitle("men's clothing"), "Men's Clothing")
    }

    func testDecodesTheCatalogueProduct() throws {
        let json = """
        {"id":11,"title":"SSD","price":109,"description":"Fast","category":"electronics","imageUrl":"https://example.com/a+b.png","rating":4.8,"ratingCount":319}
        """
        let dto = try JSONDecoder().decode(ProductDTO.self, from: Data(json.utf8))
        let product = dto.product
        XCTAssertEqual(product.id, 11)
        XCTAssertEqual(product.imageUrl.absoluteString, "https://example.com/a+b.png")
        XCTAssertEqual(product.rating, 4.8)
        XCTAssertEqual(product.ratingCount, 319)
    }
}
