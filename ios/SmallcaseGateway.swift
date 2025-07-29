import React
import UIKit

@objc(SmallcaseGateway)
class SmallcaseGateway: RCTEventEmitter {
    
    // MARK: - RCTEventEmitter Override Methods
    
    override func supportedEvents() -> [String]! {
        return ["scg_analytics_event"]
    }
    
    override func startObserving() {
        // Add observer for SCGateway analytics notifications
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAnalyticsNotification(_:)),
            name: SCGateway.shared.scgNotificationName,
            object: nil
        )
    }
    
    override func stopObserving() {
        // Remove observer when React Native stops listening
        NotificationCenter.default.removeObserver(
            self,
            name: SCGateway.shared.scgNotificationName,
            object: nil
        )
    }
    
    // MARK: - Notification Handler
    
    @objc private func handleAnalyticsNotification(_ notification: Notification) {
        // The notification object contains the JSON string
        guard let jsonString = notification.object as? String else { return }
        
        // Parse JSON string back to dictionary for React Native
        if let eventData = SCGateway.parseJSONData(jsonString) {
            // Send parsed event to React Native
            self.sendEvent(withName: "scg_analytics_event", body: eventData)
        }
    }
    
    // Add all your other existing methods here...
}