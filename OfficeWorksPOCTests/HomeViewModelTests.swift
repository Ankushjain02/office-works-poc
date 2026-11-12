import XCTest
@testable import OfficeWorksPOC

final class HomeViewModelTests: XCTestCase {
    @MainActor
    func testLoadShowsFeaturedProductsAndCategories() async {
        let repository = MockCatalogueRepository()
        repository.featuredResult = .success([SampleProduct.make(id: 1), SampleProduct.make(id: 5, title: "Bracelet")])
        repository.categoriesResult = .success(["electronics", "jewelery"])
        let model = HomeViewModel(loadHome: LoadHomeUseCase(repository: repository))

        await model.load()

        XCTAssertEqual(model.products.map(\.id), [1, 5])
        XCTAssertEqual(model.categories, ["electronics", "jewelery"])
        XCTAssertEqual(model.state, .loaded)
    }

    @MainActor
    func testSearchIsNotSentUntilTheTermIsAccepted() {
        let model = HomeViewModel(loadHome: LoadHomeUseCase(repository: MockCatalogueRepository()))

        model.searchText = "   "
        XCTAssertNil(model.submitSearch())
        XCTAssertEqual(model.searchValidation, "Enter a search term.")

        model.searchText = "  jacket  "
        XCTAssertEqual(model.submitSearch(), "jacket")
        XCTAssertNil(model.searchValidation)
    }

    @MainActor
    func testLoadFailureSurfacesAMessage() async {
        let repository = MockCatalogueRepository()
        repository.featuredResult = .failure(CatalogueError.transport("offline"))
        let model = HomeViewModel(loadHome: LoadHomeUseCase(repository: repository))

        await model.load()

        XCTAssertEqual(model.state, .failed("offline"))
        XCTAssertTrue(model.products.isEmpty)
    }
}
