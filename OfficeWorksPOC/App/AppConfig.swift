import Foundation

nonisolated enum AppConfig {
    static var apiBaseURL: URL {
        if let override = ProcessInfo.processInfo.environment["API_BASE_URL"],
           let url = URL(string: override) {
            return url
        }
        if let configured = Bundle.main.object(forInfoDictionaryKey: "APIBaseURL") as? String,
           let url = URL(string: configured) {
            return url
        }
        return URL(string: "http://127.0.0.1:3000")!
    }
}
