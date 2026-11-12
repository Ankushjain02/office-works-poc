import Combine
import Foundation

final class EnquiryFormViewModel: ObservableObject {
    enum Phase: Equatable {
        case editing
        case submitting
        case thankYou
    }

    let product: Product
    @Published var name = ""
    @Published var email = ""
    @Published var phone = ""
    @Published var message = ""
    @Published private(set) var fieldErrors: [String: String] = [:]
    @Published private(set) var formError: String?
    @Published private(set) var phase: Phase = .editing
    @Published private(set) var reference: String?

    private let submitEnquiry: SubmitEnquiryUseCase

    init(submitEnquiry: SubmitEnquiryUseCase, product: Product) {
        self.submitEnquiry = submitEnquiry
        self.product = product
    }

    func submit() async {
        guard phase != .submitting else { return }

        let errors = EnquiryValidator.errors(name: name, email: email, phone: phone, message: message)
        fieldErrors = errors
        guard errors.isEmpty else {
            formError = nil
            return
        }

        phase = .submitting
        formError = nil
        let draft = EnquiryDraft(
            productId: product.id,
            name: name.trimmingCharacters(in: .whitespacesAndNewlines),
            email: email.trimmingCharacters(in: .whitespacesAndNewlines),
            phone: phone.trimmingCharacters(in: .whitespacesAndNewlines),
            message: message.trimmingCharacters(in: .whitespacesAndNewlines)
        )
        do {
            let receipt = try await submitEnquiry.execute(draft)
            reference = receipt.reference
            phase = .thankYou
        } catch let error as CatalogueError {
            phase = .editing
            if case let .server(_, message, fields) = error {
                if !fields.isEmpty { fieldErrors = fields }
                formError = message
            } else {
                formError = ErrorMessage.describe(error)
            }
        } catch {
            phase = .editing
            formError = ErrorMessage.describe(error)
        }
    }
}
