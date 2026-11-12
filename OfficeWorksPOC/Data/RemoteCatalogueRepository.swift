import Foundation

/// HTTP implementation of the catalogue repository. The only type that knows URLs and JSON.
nonisolated struct RemoteCatalogueRepository: CatalogueRepository {
    var baseURL: URL
    var session: URLSession = .shared

    func featuredProducts() async throws -> [Product] {
        let response: ProductListDTO = try await get(path: "/api/products/featured")
        return response.products.map(\.product)
    }

    func categories() async throws -> [String] {
        let response: CategoryListDTO = try await get(path: "/api/categories")
        return response.categories
    }

    func products(in category: String) async throws -> CategoryListing {
        let response: CategoryListingDTO = try await get(
            path: "/api/products",
            query: [URLQueryItem(name: "category", value: category)]
        )
        return response.listing
    }

    func search(_ query: String) async throws -> [Product] {
        let response: SearchResultsDTO = try await get(
            path: "/api/products/search",
            query: [URLQueryItem(name: "q", value: query)]
        )
        return response.products.map(\.product)
    }

    func submitEnquiry(_ draft: EnquiryDraft) async throws -> EnquiryReceipt {
        let response: EnquiryReceiptDTO = try await post(path: "/api/enquiries", body: EnquiryRequestDTO(draft))
        return response.receipt
    }

    private func get<T: Decodable>(path: String, query: [URLQueryItem] = []) async throws -> T {
        var request = URLRequest(url: try makeURL(path: path, query: query))
        request.timeoutInterval = 20
        return try await send(request)
    }

    private func post<Body: Encodable, T: Decodable>(path: String, body: Body) async throws -> T {
        var request = URLRequest(url: try makeURL(path: path))
        request.httpMethod = "POST"
        request.timeoutInterval = 20
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(body)
        return try await send(request)
    }

    private func send<T: Decodable>(_ request: URLRequest) async throws -> T {
        do {
            let (data, response) = try await session.data(for: request)
            try validate(data: data, response: response)
            do {
                return try JSONDecoder().decode(T.self, from: data)
            } catch {
                throw CatalogueError.decodingFailed
            }
        } catch let error as CatalogueError {
            throw error
        } catch let error as URLError {
            throw CatalogueError.transport(Self.transportMessage(error))
        } catch {
            throw CatalogueError.transport("The catalogue could not be reached.")
        }
    }

    private func makeURL(path: String, query: [URLQueryItem] = []) throws -> URL {
        guard var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false) else {
            throw CatalogueError.invalidURL
        }
        let basePath = components.path.hasSuffix("/") ? String(components.path.dropLast()) : components.path
        components.path = basePath + path
        components.queryItems = query.isEmpty ? nil : query
        guard let url = components.url else { throw CatalogueError.invalidURL }
        return url
    }

    private func validate(data: Data, response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse else { throw CatalogueError.decodingFailed }
        guard (200..<300).contains(http.statusCode) else {
            let body = try? JSONDecoder().decode(APIErrorDTO.self, from: data)
            throw CatalogueError.server(
                status: http.statusCode,
                message: body?.error.message ?? "The catalogue could not complete that request.",
                fields: body?.error.fields ?? [:]
            )
        }
    }

    private static func transportMessage(_ error: URLError) -> String {
        switch error.code {
        case .cannotConnectToHost, .cannotFindHost, .networkConnectionLost, .notConnectedToInternet, .timedOut:
            return "Could not reach the catalogue. Start the backend on port 3000 and try again."
        default:
            return "The catalogue could not be reached."
        }
    }
}
