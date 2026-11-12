import Combine

/// The product is already on screen. Tapping a tile does not wait for another request.
final class ProductDetailViewModel: ObservableObject {
    let product: Product

    init(product: Product) {
        self.product = product
    }
}
