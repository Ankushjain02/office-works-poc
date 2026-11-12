import Foundation

nonisolated enum ProductFormatting {
    static func price(_ value: Double) -> String {
        Formatters.price.string(from: NSNumber(value: value)) ?? "USD \(value)"
    }

    static func rating(_ value: Double, count: Int) -> String {
        let number = Formatters.rating.string(from: NSNumber(value: value)) ?? "\(value)"
        let reviews = count == 1 ? "1 review" : "\(count) reviews"
        return "\(number) · \(reviews)"
    }

    static func categoryTitle(_ raw: String) -> String {
        if raw.caseInsensitiveCompare("jewelery") == .orderedSame {
            return "Jewellery"
        }
        return raw.split(separator: " ").map { word in
            guard let first = word.first else { return "" }
            return first.uppercased() + word.dropFirst()
        }.joined(separator: " ")
    }
}

/// NumberFormatter is expensive to create and these screens format every visible price.
private nonisolated enum Formatters {
    static let price: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        formatter.locale = Locale(identifier: "en_US")
        return formatter
    }()

    static let rating: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.locale = Locale(identifier: "en_US")
        formatter.minimumFractionDigits = 1
        formatter.maximumFractionDigits = 1
        return formatter
    }()
}
