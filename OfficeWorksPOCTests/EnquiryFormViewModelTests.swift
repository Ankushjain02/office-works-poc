import XCTest
@testable import OfficeWorksPOC

final class EnquiryFormViewModelTests: XCTestCase {
    @MainActor
    func testInvalidEmailDoesNotSubmitOrShowThankYou() async {
        let repository = MockCatalogueRepository()
        let model = EnquiryFormViewModel(submitEnquiry: SubmitEnquiryUseCase(repository: repository), product: SampleProduct.make())
        model.name = "Ada Lovelace"
        model.email = "not-an-email"
        model.phone = "+61 400 000 000"

        await model.submit()

        XCTAssertEqual(model.fieldErrors["email"], "Enter a valid email address.")
        XCTAssertTrue(repository.enquiryCalls.isEmpty)
        XCTAssertEqual(model.phase, .editing)
        XCTAssertNil(model.reference)
    }

    @MainActor
    func testSuccessfulSubmitShowsThankYou() async {
        let repository = MockCatalogueRepository()
        let model = EnquiryFormViewModel(submitEnquiry: SubmitEnquiryUseCase(repository: repository), product: SampleProduct.make(id: 9))
        model.name = "Ada Lovelace"
        model.email = "ada@example.com"
        model.phone = "+61 400 000 000"
        model.message = "Is this in stock?"

        await model.submit()

        XCTAssertEqual(model.phase, .thankYou)
        XCTAssertEqual(model.reference, "enq_test")
        XCTAssertEqual(repository.enquiryCalls.map(\.productId), [9])
        XCTAssertEqual(repository.enquiryCalls.first?.email, "ada@example.com")
    }

    @MainActor
    func testDeliveryFailureDoesNotShowThankYou() async {
        let repository = MockCatalogueRepository()
        repository.enquiryResult = .failure(
            CatalogueError.server(status: 503, message: "We could not send your enquiry. Please try again.", fields: [:])
        )
        let model = EnquiryFormViewModel(submitEnquiry: SubmitEnquiryUseCase(repository: repository), product: SampleProduct.make())
        model.name = "Ada Lovelace"
        model.email = "ada@example.com"
        model.phone = "0400000000"

        await model.submit()

        XCTAssertEqual(model.phase, .editing)
        XCTAssertEqual(model.formError, "We could not send your enquiry. Please try again.")
        XCTAssertNil(model.reference)
    }
}

final class ProductDetailViewModelTests: XCTestCase {
    @MainActor
    func testShowsTheSelectedProductWithoutAnotherRequest() {
        let model = ProductDetailViewModel(product: SampleProduct.make(id: 9, title: "Drive"))
        XCTAssertEqual(model.product.id, 9)
        XCTAssertEqual(model.product.title, "Drive")
    }
}
