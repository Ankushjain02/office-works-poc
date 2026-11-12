import Combine
import SwiftUI

nonisolated enum Route: Hashable {
    case category(String)
    case search(String)
    case product(Product)
}

final class Router: ObservableObject {
    @Published var path = NavigationPath()

    func showCategory(_ name: String) {
        path.append(Route.category(name))
    }

    func showSearch(_ query: String) {
        path.append(Route.search(query))
    }

    func showProduct(_ product: Product) {
        path.append(Route.product(product))
    }
}
