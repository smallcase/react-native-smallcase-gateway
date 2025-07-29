import React
import UIKit

@objc(SmallcaseGateway)
class SmallcaseGateway: RCTEventEmitter {
    
    // MARK: - RCTEventEmitter Required Methods
    
    override func supportedEvents() -> [String]! {
        return ["scg_analytics_event"]
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    override func startObserving() {
        // Add observer for SCGateway analytics notifications
        // Replace 'scgNotificationName' with the actual notification name from your SDK
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAnalyticsNotification(_:)),
            name: SCGateway.shared.scgNotificationName, // Replace with actual notification name
            object: nil
        )
    }
    
    override func stopObserving() {
        // Remove observer when React Native stops listening
        NotificationCenter.default.removeObserver(
            self,
            name: SCGateway.shared.scgNotificationName, // Replace with actual notification name
            object: nil
        )
    }
    
    // MARK: - Notification Handler
    
    @objc private func handleAnalyticsNotification(_ notification: Notification) {
        var eventData: [String: Any] = [:]
        
        // Handle different types of notification data
        if let jsonString = notification.object as? String {
            // If notification contains JSON string
            eventData = parseJSONString(jsonString) ?? [:]
        } else if let userInfo = notification.userInfo {
            // If notification contains userInfo dictionary
            eventData = userInfo as? [String: Any] ?? [:]
        } else if let dataDict = notification.object as? [String: Any] {
            // If notification contains dictionary directly
            eventData = dataDict
        }
        
        // Send event to React Native
        self.sendEvent(withName: "scg_analytics_event", body: eventData)
    }
    
    // MARK: - Helper Methods
    
    private func parseJSONString(_ jsonString: String) -> [String: Any]? {
        guard let data = jsonString.data(using: .utf8) else { return nil }
        
        do {
            let json = try JSONSerialization.jsonObject(with: data, options: [])
            return json as? [String: Any]
        } catch {
            print("Error parsing JSON: \(error)")
            return nil
        }
    }
    
    // Add all your existing RCT_REMAP_METHOD implementations here...
    // (Keep all the existing methods from your .m file)
}