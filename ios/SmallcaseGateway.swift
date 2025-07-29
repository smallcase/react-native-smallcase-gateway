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
        guard hasListeners else { return }

        var eventPayload: [String: Any] = [:]

        if let jsonString = notification.object as? String {
            eventPayload = parseJSONString(jsonString) ?? [:]
        } else if let userInfo = notification.userInfo {
            eventPayload = userInfo as? [String: Any] ?? [:]
        } else if let dict = notification.object as? [String: Any] {
            eventPayload = dict
        }

        sendEvent(withName: "scg_analytics_event", body: eventPayload)
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
