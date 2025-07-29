import Foundation
import React

// Protocol to avoid direct dependency on SCGateway
@objc protocol SCGatewayProtocol {
    @objc var scgNotificationName: Notification.Name { get }
    @objc static var shared: SCGatewayProtocol { get }
}

@objc(SCGatewayBridgeEmitter)
class SCGatewayBridgeEmitter: RCTEventEmitter {
    
    // MARK: - Static Properties
    private static var shared: SCGatewayBridgeEmitter?
    private var isListening = false
    private var notificationObserver: NSObjectProtocol?
    
    // MARK: - Lifecycle
    
    override init() {
        super.init()
        SCGatewayBridgeEmitter.shared = self
        
        #if DEBUG
        print("SCGatewayBridgeEmitter: Initialized")
        #endif
    }
    
    deinit {
        stopListening()
    }
    
    // MARK: - RCTEventEmitter Override Methods
    
    override func supportedEvents() -> [String]! {
        return [
            "scgateway_analytics_event",
            "scgateway_super_properties_updated",
            "scgateway_user_reset",
            "scgateway_user_identify"
        ]
    }
    
    override func startObserving() {
        super.startObserving()
        startListening()
    }
    
    override func stopObserving() {
        super.stopObserving()
        stopListening()
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    // MARK: - Public Methods Exposed to React Native
    
    @objc func startListening(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async { [weak self] in
            let success = self?.startListening() ?? false
            if success {
                resolve("Started listening to SCGateway events")
            } else {
                reject("START_LISTENING_FAILED", "Failed to start listening to SCGateway events", nil)
            }
        }
    }
    
    @objc func stopListening(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async { [weak self] in
            self?.stopListening()
            resolve("Stopped listening to SCGateway events")
        }
    }
    
    // MARK: - Private Methods
    
    @discardableResult
    private func startListening() -> Bool {
        guard !isListening else {
            #if DEBUG
            print("SCGatewayBridgeEmitter: Already listening")
            #endif
            return true
        }
        
        // Remove any existing observer first
        stopListening()
        
        // Try to get SCGateway using runtime lookup
        guard let notificationName = getSCGatewayNotificationName() else {
            #if DEBUG
            print("SCGatewayBridgeEmitter: Could not get SCGateway notification name")
            #endif
            return false
        }
        
        // Add observer for SCGateway notifications
        notificationObserver = NotificationCenter.default.addObserver(
            forName: notificationName,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            self?.handleSCGatewayNotification(notification)
        }
        
        isListening = true
        
        #if DEBUG
        print("SCGatewayBridgeEmitter: Started listening to notifications with name: \(notificationName)")
        #endif
        
        return true
    }
    
    private func stopListening() {
        guard isListening, let observer = notificationObserver else { return }
        
        NotificationCenter.default.removeObserver(observer)
        notificationObserver = nil
        isListening = false
        
        #if DEBUG
        print("SCGatewayBridgeEmitter: Stopped listening to notifications")
        #endif
    }
    
    private func getSCGatewayNotificationName() -> Notification.Name? {
        // Method 1: Try to get SCGateway class using runtime
        if let scGatewayClass = NSClassFromString("SCGateway.SCGateway") as? NSObject.Type {
            let sharedSelector = NSSelectorFromString("shared")
            if scGatewayClass.responds(to: sharedSelector) {
                if let shared = scGatewayClass.perform(sharedSelector)?.takeUnretainedValue() {
                    let notificationSelector = NSSelectorFromString("scgNotificationName")
                    if shared.responds(to: notificationSelector) {
                        if let result = shared.perform(notificationSelector)?.takeUnretainedValue() as? Notification.Name {
                            return result
                        }
                    }
                }
            }
        }
        
        // Method 2: Try alternative class name
        if let scGatewayClass = NSClassFromString("SCGateway") as? NSObject.Type {
            let sharedSelector = NSSelectorFromString("shared")
            if scGatewayClass.responds(to: sharedSelector) {
                if let shared = scGatewayClass.perform(sharedSelector)?.takeUnretainedValue() {
                    let notificationSelector = NSSelectorFromString("scgNotificationName")
                    if shared.responds(to: notificationSelector) {
                        if let result = shared.perform(notificationSelector)?.takeUnretainedValue() as? Notification.Name {
                            return result
                        }
                    }
                }
            }
        }
        
        // Method 3: Fallback to hardcoded notification name
        // You may need to check what the actual notification name is in your SCGateway implementation
        return Notification.Name("SCGatewayAnalyticsNotification")
    }
    
    private func handleSCGatewayNotification(_ notification: Notification) {
        guard let jsonString = notification.object as? String else {
            #if DEBUG
            print("SCGatewayBridgeEmitter: Invalid notification object - expected JSON string, got: \(type(of: notification.object))")
            #endif
            return
        }
        
        // Parse the JSON string to extract notification details
        guard let notificationData = parseNotificationJSON(jsonString) else {
            #if DEBUG
            print("SCGatewayBridgeEmitter: Failed to parse notification JSON: \(jsonString)")
            #endif
            return
        }
        
        // Map notification type to React Native event name
        let eventName = mapNotificationTypeToEventName(notificationData["type"] as? String)
        
        // Emit the event to React Native
        sendEvent(withName: eventName, body: notificationData)
        
        #if DEBUG
        print("SCGatewayBridgeEmitter: Emitted event '\(eventName)' with data: \(notificationData)")
        #endif
    }
    
    private func parseNotificationJSON(_ jsonString: String) -> [String: Any]? {
        guard let jsonData = jsonString.data(using: .utf8) else {
            #if DEBUG
            print("SCGatewayBridgeEmitter: Could not convert JSON string to data")
            #endif
            return nil
        }
        
        do {
            return try JSONSerialization.jsonObject(with: jsonData, options: []) as? [String: Any]
        } catch {
            #if DEBUG
            print("SCGatewayBridgeEmitter: JSON parsing error: \(error)")
            #endif
            return nil
        }
    }
    
    private func mapNotificationTypeToEventName(_ type: String?) -> String {
        guard let type = type else {
            #if DEBUG
            print("SCGatewayBridgeEmitter: No event type found, using unknown_event")
            #endif
            return "scgateway_unknown_event"
        }
        
        switch type {
        case "analytics_event":
            return "scgateway_analytics_event"
        case "analytics_super_properties_updated":
            return "scgateway_super_properties_updated"
        case "user_reset":
            return "scgateway_user_reset"
        case "user_identify":
            return "scgateway_user_identify"
        default:
            #if DEBUG
            print("SCGatewayBridgeEmitter: Unknown event type: \(type)")
            #endif
            return "scgateway_unknown_event"
        }
    }
    
    // MARK: - Static Helper Methods for External Access
    
    static func emitEvent(name: String, data: [String: Any]) {
        DispatchQueue.main.async {
            shared?.sendEvent(withName: name, body: data)
        }
    }
    
    static func isCurrentlyListening() -> Bool {
        return shared?.isListening ?? false
    }
    
    // MARK: - Debug Methods
    
    @objc func getDebugInfo(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        let debugInfo: [String: Any] = [
            "isListening": isListening,
            "hasObserver": notificationObserver != nil,
            "supportedEvents": supportedEvents() ?? [],
            "scgatewayClassExists": NSClassFromString("SCGateway.SCGateway") != nil || NSClassFromString("SCGateway") != nil,
            "notificationName": getSCGatewayNotificationName()?.rawValue ?? "unknown"
        ]
        resolve(debugInfo)
    }
}

