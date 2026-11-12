import Foundation

nonisolated struct EnquiryDraft: Equatable, Sendable {
    let productId: Int
    let name: String
    let email: String
    let phone: String
    let message: String
}

nonisolated struct EnquiryReceipt: Equatable, Sendable {
    let status: String
    let reference: String
}

nonisolated enum EnquiryValidator {
    private static let namePattern = #"^[\p{L}\p{M}][\p{L}\p{M}\s'.-]{1,79}$"#
    private static let emailPattern = #"^[^\s@]+@[^\s@]+\.[^\s@]+$"#

    static func errors(name: String, email: String, phone: String, message: String) -> [String: String] {
        var errors: [String: String] = [:]
        let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedPhone = phone.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedMessage = message.trimmingCharacters(in: .whitespacesAndNewlines)

        if trimmedName.count < 2 {
            errors["name"] = "Name must be at least 2 characters."
        } else if trimmedName.count > 80 {
            errors["name"] = "Name must be 80 characters or fewer."
        } else if trimmedName.range(of: namePattern, options: .regularExpression) == nil {
            errors["name"] = "Use letters, spaces, apostrophes, or hyphens."
        }

        if trimmedEmail.count > 254 {
            errors["email"] = "Email is too long."
        } else if trimmedEmail.range(of: emailPattern, options: .regularExpression) == nil {
            errors["email"] = "Enter a valid email address."
        }

        if trimmedPhone.count > 30 {
            errors["phone"] = "Phone number is too long."
        } else if !isPhone(trimmedPhone) {
            errors["phone"] = "Enter a phone number with 8 to 15 digits."
        }

        if trimmedMessage.count > 1000 {
            errors["message"] = "Message must be 1000 characters or fewer."
        }
        return errors
    }

    private static func isPhone(_ value: String) -> Bool {
        guard value.range(of: #"^[+0-9][0-9\s().-]*$"#, options: .regularExpression) != nil else {
            return false
        }
        let digits = value.filter { $0.isASCII && $0.isNumber }.count
        return digits >= 8 && digits <= 15
    }
}

nonisolated enum SearchQuery {
    struct Rejection: Error {
        let message: String
    }

    static func accepted(from raw: String) -> Result<String, Rejection> {
        let query = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if query.isEmpty {
            return .failure(Rejection(message: "Enter a search term."))
        }
        if query.count > 100 {
            return .failure(Rejection(message: "Search term is too long."))
        }
        return .success(query)
    }
}
