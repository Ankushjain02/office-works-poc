import Foundation

nonisolated enum ScreenState: Equatable {
    case loading
    case loaded
    case failed(String)
}

enum ErrorMessage {
    static func describe(_ error: Error) -> String {
        guard let catalogue = error as? CatalogueError else {
            return "Something went wrong."
        }
        switch catalogue {
        case .invalidURL:
            return "The catalogue address is invalid."
        case .decodingFailed:
            return "The catalogue returned something unexpected."
        case .transport(let message):
            return message
        case .server(_, let message, _):
            return message
        }
    }
}
