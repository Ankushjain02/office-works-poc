import SwiftUI

struct EnquiryFormView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var model: EnquiryFormViewModel

    @MainActor
    init(submitEnquiry: SubmitEnquiryUseCase, product: Product) {
        _model = StateObject(wrappedValue: EnquiryFormViewModel(submitEnquiry: submitEnquiry, product: product))
    }

    var body: some View {
        NavigationStack {
            Group {
                if model.phase == .thankYou {
                    thankYou
                } else {
                    form
                }
            }
            .background(Theme.canvas)
            .navigationTitle("Enquire")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                        .disabled(model.phase == .submitting)
                }
            }
        }
        .interactiveDismissDisabled(model.phase == .submitting)
    }

    private var form: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(model.product.title)
                    .font(.system(.headline, design: .serif))
                field("Name", error: model.fieldErrors["name"]) {
                    TextField("Your name", text: $model.name)
                        .textContentType(.name)
                }
                field("Email", error: model.fieldErrors["email"]) {
                    TextField("you@example.com", text: $model.email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                }
                field("Phone", error: model.fieldErrors["phone"]) {
                    TextField("Phone number", text: $model.phone)
                        .textContentType(.telephoneNumber)
                        .keyboardType(.phonePad)
                }
                field("Message", error: model.fieldErrors["message"]) {
                    TextField("Optional note", text: $model.message, axis: .vertical)
                        .lineLimit(3...6)
                }
                if let formError = model.formError {
                    Text(formError)
                        .font(.footnote)
                        .foregroundStyle(Theme.danger)
                }
            }
            .padding(16)
        }
        .safeAreaInset(edge: .bottom) {
            Button {
                Task { await model.submit() }
            } label: {
                if model.phase == .submitting {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                } else {
                    Text("Send enquiry")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .disabled(model.phase == .submitting)
            .padding(16)
            .accessibilityIdentifier("submitEnquiryButton")
        }
    }

    private var thankYou: some View {
        VStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 48))
                .foregroundStyle(Theme.accent)
            Text("Thank you")
                .font(.system(size: 34, weight: .semibold, design: .serif))
                .accessibilityIdentifier("thankYouMessage")
            Text("Your enquiry is with the sales team.")
                .foregroundStyle(Theme.muted)
                .multilineTextAlignment(.center)
            if let reference = model.reference {
                Text("Reference \(reference)")
                    .font(.footnote.monospaced())
                    .foregroundStyle(Theme.muted)
            }
            Button("Done") { dismiss() }
                .buttonStyle(.borderedProminent)
                .padding(.top, 8)
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func field<Control: View>(_ title: String, error: String?, @ViewBuilder control: () -> Control) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.subheadline.weight(.semibold))
            control()
                .padding(12)
                .background(Theme.card)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay {
                    RoundedRectangle(cornerRadius: 12).stroke(Theme.line, lineWidth: 1)
                }
            if let error {
                Text(error)
                    .font(.footnote)
                    .foregroundStyle(Theme.danger)
            }
        }
    }
}
