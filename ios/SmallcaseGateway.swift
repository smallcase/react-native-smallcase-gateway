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
        print("🎯 SmallcaseGateway: Starting to observe SCGateway notifications")
        
        // Add observer for SCGateway analytics notifications
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAnalyticsNotification(_:)),
            name: SCGateway.shared.scgNotificationName,
            object: nil
        )
        
        print("✅ SmallcaseGateway: Observer added for notification: \(SCGateway.shared.scgNotificationName)")
    }
    
    override func stopObserving() {
        print("🛑 SmallcaseGateway: Stopping observation of SCGateway notifications")
        
        NotificationCenter.default.removeObserver(
            self,
            name: SCGateway.shared.scgNotificationName,
            object: nil
        )
    }
    
    // MARK: - Notification Handler
    
    @objc private func handleAnalyticsNotification(_ notification: Notification) {
        print("🔥 SmallcaseGateway: Received notification: \(notification.name)")
        print("🔥 SmallcaseGateway: Notification object type: \(type(of: notification.object))")
        
        // According to SCGateway implementation, the notification.object contains the complete JSON string
        guard let jsonString = notification.object as? String else {
            print("❌ SmallcaseGateway: Expected JSON string in notification.object, got: \(String(describing: notification.object))")
            return
        }
        
        print("📝 SmallcaseGateway: Raw JSON string: \(jsonString)")
        
        // Parse the JSON string to get the notification structure
        guard let notificationData = parseJSONString(jsonString) else {
            print("❌ SmallcaseGateway: Failed to parse JSON string")
            return
        }
        
        print("✅ SmallcaseGateway: Parsed notification data: \(notificationData)")
        
        // The parsed data contains: type, timestamp, and data (which is another JSON string)
        guard let notificationType = notificationData["type"] as? String,
              let timestamp = notificationData["timestamp"] as? String,
              let dataString = notificationData["data"] as? String else {
            print("❌ SmallcaseGateway: Invalid notification structure")
            return
        }
        
        // Parse the inner data JSON string
        let innerData = parseJSONString(dataString) ?? [:]
        
        // Create the final event data structure for React Native
        let eventData: [String: Any] = [
            "type": notificationType,
            "timestamp": timestamp,
            "data": innerData
        ]
        
        print("🚀 SmallcaseGateway: Sending to React Native: \(eventData)")
        
        // Send event to React Native
        self.sendEvent(withName: "scg_analytics_event", body: eventData)
    }
    
    // MARK: - Helper Methods
    
    private func parseJSONString(_ jsonString: String) -> [String: Any]? {
        guard let data = jsonString.data(using: .utf8) else {
            print("❌ SmallcaseGateway: Failed to convert string to data")
            return nil
        }
        
        do {
            let json = try JSONSerialization.jsonObject(with: data, options: [])
            return json as? [String: Any]
        } catch {
            print("❌ SmallcaseGateway: Error parsing JSON: \(error)")
            print("❌ SmallcaseGateway: JSON string was: \(jsonString)")
            return nil
        }
    }
    
    // MARK: - React Native Analytics Methods
    
    // Store callback references (Note: This is a workaround - not ideal for React Native)
    private static var callbackId: String?
    
    @RCT_REMAP_METHOD(addAnalyticsEventListener,
                     addAnalyticsEventListenerWithCallbackId:(NSString*)callbackId
                     resolver:(RCTPromiseResolveBlock)resolve 
                     rejecter:(RCTPromiseRejectBlock)reject)
    func addAnalyticsEventListener(callbackId: NSString, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        
        print("🎯 SmallcaseGateway: addAnalyticsEventListener called with callbackId: \(callbackId)")
        
        // Store the callback ID for later use
        SmallcaseGateway.callbackId = callbackId as String
        
        // Return subscription-like object
        let subscriptionInfo: [String: Any] = [
            "status": "active",
            "eventName": "scg_analytics_event", 
            "callbackId": callbackId,
            "remove": "Call removeAnalyticsEventListener to cleanup"
        ]
        
        resolve(subscriptionInfo)
    }
    
    @RCT_REMAP_METHOD(removeAnalyticsEventListener,
                     removeAnalyticsEventListenerWithResolver:(RCTPromiseResolveBlock)resolve 
                     rejecter:(RCTPromiseRejectBlock)reject)
    func removeAnalyticsEventListener(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        
        SmallcaseGateway.callbackId = nil
        print("🗑️ SmallcaseGateway: Analytics event listener removed")
        resolve("Analytics listener removed")
    }
    
    // Override the notification handler to also call JS callbacks
    @objc override func handleAnalyticsNotification(_ notification: Notification) {
        // First, handle the normal NativeEventEmitter flow
        super.handleAnalyticsNotification(notification)
        
        // Then, if there's a stored callback ID, also trigger it
        if let callbackId = SmallcaseGateway.callbackId {
            // Parse notification data
            guard let jsonString = notification.object as? String,
                  let notificationData = parseJSONString(jsonString) else {
                return
            }
            
            guard let notificationType = notificationData["type"] as? String,
                  let timestamp = notificationData["timestamp"] as? String,
                  let dataString = notificationData["data"] as? String else {
                return
            }
            
            let innerData = parseJSONString(dataString) ?? [:]
            
            let eventData: [String: Any] = [
                "type": notificationType,
                "timestamp": timestamp,
                "data": innerData
            ]
            
            // Call the stored JavaScript callback
            // Note: This is a complex workaround - normally React Native doesn't support this
            print("📞 Would call JS callback \(callbackId) with: \(eventData)")
        }
    }
    
    // MARK: - Analytics Listener Method for Host App
    
    @RCT_REMAP_METHOD(addAnalyticsEventListener,
                     addAnalyticsEventListenerWithResolver:(RCTPromiseResolveBlock)resolve 
                     rejecter:(RCTPromiseRejectBlock)reject)
    func addAnalyticsEventListenerMethod(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        
        print("🎯 SmallcaseGateway: addAnalyticsEventListener called from React Native")
        
        // Return subscription info that the host app expects
        let subscriptionInfo: [String: Any] = [
            "status": "active",
            "eventName": "scg_analytics_event",
            "notificationName": SCGateway.shared.scgNotificationName.rawValue,
            "isAnalyticsActive": SCGateway.isAnalyticsActive,
            "message": "Analytics listener setup complete"
        ]
        
        resolve(subscriptionInfo)
    }
    
    // MARK: - Debug Methods (Optional)
    
    @RCT_REMAP_METHOD(testNotificationFlow, 
                     testNotificationFlowWithResolver:(RCTPromiseResolveBlock)resolve 
                     rejecter:(RCTPromiseRejectBlock)reject)
    func testNotificationFlow(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        
        // Test if SCGateway analytics is active
        let isActive = SCGateway.isAnalyticsActive
        
        // Create a test event to verify the flow
        let testData: [String: Any] = [
            "isAnalyticsActive": isActive,
            "notificationName": SCGateway.shared.scgNotificationName.rawValue,
            "sdkVersion": SCGateway.shared.getSdkVersion()
        ]
        
        // Send test event
        self.sendEvent(withName: "scg_analytics_event", body: [
            "type": "test_event",
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "data": testData
        ])
        
        resolve(testData)
    }
    
    @RCT_REMAP_METHOD(triggerTestAnalyticsEvent,
                     triggerTestAnalyticsEventWithResolver:(RCTPromiseResolveBlock)resolve 
                     rejecter:(RCTPromiseRejectBlock)reject)
    func triggerTestAnalyticsEvent(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        
        // Trigger a test analytics event via SCGateway
        SCGateway.shared.registerAnalyticsEvent(
            eventName: "test_react_native_bridge", 
            additionalProperties: [
                "source": "react_native_bridge",
                "timestamp": Date().timeIntervalSince1970
            ]
        )
        
        resolve("Test analytics event triggered")
    }
    
    // MARK: - React Native Convenience Methods
    
    @RCT_REMAP_METHOD(addAnalyticsEventListener,
                     addAnalyticsEventListenerWithResolver:(RCTPromiseResolveBlock)resolve 
                     rejecter:(RCTPromiseRejectBlock)reject)
    func addAnalyticsEventListener(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        
        // This method just confirms that the listener is set up
        // The actual listening happens through the NativeEventEmitter
        let listenerInfo = [
            "status": "active",
            "eventName": "scg_analytics_event",
            "notificationName": SCGateway.shared.scgNotificationName.rawValue,
            "isAnalyticsActive": SCGateway.isAnalyticsActive
        ]
        
        resolve(listenerInfo)
    }
    
    // Add all your existing RCT_REMAP_METHOD implementations here...
    // (Keep all the existing methods from your .m file)
}