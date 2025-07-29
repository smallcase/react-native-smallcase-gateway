import React
import UIKit

@objc(SmallcaseGateway)
class SmallcaseGateway: RCTEventEmitter {

    private var hasListeners = false

    // MARK: - Events

    override func supportedEvents() -> [String]! {
        return ["scg_analytics_event"]
    }

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    // MARK: - Lifecycle

    override func startObserving() {
        hasListeners = true
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAnalyticsNotification(_:)),
            name: SCGateway.shared.scgNotificationName,
            object: nil
        )
    }

    override func stopObserving() {
        hasListeners = false
        NotificationCenter.default.removeObserver(
            self,
            name: SCGateway.shared.scgNotificationName,
            object: nil
        )
    }

    // MARK: - Notification Handler

   @objc private func handleAnalyticsNotification(_ notification: Notification) {
    print("📬 [RN Plugin] Received notification from iOS Native SDK")

    guard let jsonString = notification.object as? String,
          let data = jsonString.data(using: .utf8),
          let payload = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
        print("❌ [RN Plugin] Failed to parse notification payload")
        return
    }

    print("📦 [RN Plugin] Sending event to JS: \(payload)")
    sendEvent(withName: "scg_analytics_event", body: payload)
}


    // MARK: - JSON Parser

    private func parseJSONString(_ jsonString: String) -> [String: Any]? {
        guard let data = jsonString.data(using: .utf8) else { return nil }
        do {
            return try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any]
        } catch {
            print("❌ JSON parse error:", error.localizedDescription)
            return nil
        }
    }

    // MARK: - Example Exported Method

    @objc func startAnalyticsListener(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
        // Logic if needed before the listener starts
        print("🎯 Analytics listener start requested.")
        resolve("Listener started successfully 🚀")
    }
}
