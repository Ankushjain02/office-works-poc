import XCTest
@testable import OfficeWorksPOC

final class SearchViewModelTests: XCTestCase {
    @MainActor
    func testCreatingTheViewModelDoesNotSearch() {
        let repository = MockCatalogueRepository()
        _ = SearchViewModel(search: SearchProductsUseCase(repository: repository), query: "jacket")
        XCTAssertTrue(repository.searchCalls.isEmpty)
    }

    @MainActor
    func testLoadSearchesForTheSubmittedTerm() async {
        let repository = MockCatalogueRepository()
        repository.searchResult = .success([SampleProduct.make(id: 3, title: "Jacket")])
        let model = SearchViewModel(search: SearchProductsUseCase(repository: repository), query: "jacket")

        await model.load()

        XCTAssertEqual(repository.searchCalls, ["jacket"])
        XCTAssertEqual(model.products.map(\.id), [3])
        XCTAssertEqual(model.state, .loaded)
    }
}

final class CategoryProductsViewModelTests: XCTestCase {
    @MainActor
    func testLoadKeepsTopRatedAndAdditionalSeparate() async {
        let repository = MockCatalogueRepository()
        repository.listingResult = .success(
            CategoryListing(
                category: "electronics",
                topRated: [SampleProduct.make(id: 9, category: "electronics")],
                additional: [SampleProduct.make(id: 10, title: "Cable", category: "electronics")]
            )
        )
        let model = CategoryProductsViewModel(loadCategory: LoadCategoryUseCase(repository: repository), category: "electronics")

        await model.load()

        XCTAssertEqual(repository.categoryCalls, ["electronics"])
        XCTAssertEqual(model.topRated.map(\.id), [9])
        XCTAssertEqual(model.additional.map(\.id), [10])
    }
}
