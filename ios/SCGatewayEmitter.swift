import Foundation
import React

// Protocol to avoid direct dependency on SCGateway
// @objc protocol SCGatewayProtocol {
//     @objc var scgNotificationName: Notification.Name { get }
//     @objc static var shared: SCGatewayProtocol { get }
// }

@objc(SCGatewayEmitter)
class SCGatewayEmitter: RCTEventEmitter {
    
    // MARK: - Static Properties
    private static var shared: SCGatewayEmitter?
    private var isListening = false
    private var notificationObserver: NSObjectProtocol?
    
    // MARK: - Lifecycle
    
    override init() {
        super.init()
        SCGatewayEmitter.shared = self
        print("SCGatewayEmitter: Initialized.")
        self.startListening()
    }
    
    deinit {
        print("SCGatewayEmitter: Deinitializing.")
        stopListening()
    }
    
    // MARK: - RCTEventEmitter Override Methods
    
    override func supportedEvents() -> [String]! { // only 1 event scg_notifi as mentioned
    // clean it
        return [
            // only single 
            "scgateway_analytics_event",
            "scgateway_super_properties_updated",
            "scgateway_user_reset",
            "scgateway_user_identify"
        ]
    }
    
    override func startObserving() {
        super.startObserving()
        print("SCGatewayEmitter: startObserving called.")
        startListening()
    }
    
    override func stopObserving() {
        super.stopObserving()
        print("SCGatewayEmitter: stopObserving called.")
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
        print("SCGatewayEmitter: React Native requested startListening.")
        DispatchQueue.main.async { [weak self] in
            let success = self?.startListening() ?? false
            if success {
                print("SCGatewayEmitter: Successfully started listening from React Native request.")
                resolve("Started listening to SCGateway events")
            } else {
                print("SCGatewayEmitter: Failed to start listening from React Native request.")
                reject("START_LISTENING_FAILED", "Failed to start listening to SCGateway events", nil)
            }
        }
    }
    
    @objc func stopListening(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        print("SCGatewayEmitter: React Native requested stopListening.")
        DispatchQueue.main.async { [weak self] in
            self?.stopListening()
            print("SCGatewayEmitter: Successfully stopped listening from React Native request.")
            resolve("Stopped listening to SCGateway events")
        }
    }
    
    // MARK: - Private Methods
    
    @discardableResult
    private func startListening() -> Bool {
        print("SCGatewayEmitter: Private startListening called.")
        guard !isListening else {
            print("SCGatewayEmitter: Already listening, no action needed.")
            return true
        }
        
        // Remove any existing observer first
        stopListening()
        
        // Try to get SCGateway using runtime lookup
        guard let notificationName = getSCGatewayNotificationName() else {
            print("SCGatewayEmitter: Could not get SCGateway notification name, cannot start listening.")
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
        
        print("SCGatewayEmitter: Started listening to notifications with name: \(notificationName).")
        
        return true
    }
    
    private func stopListening() {
        print("SCGatewayEmitter: Private stopListening called.")
        guard isListening, let observer = notificationObserver else { 
            print("SCGatewayEmitter: Not listening or no observer, no action needed.")
            return 
        }
        
        NotificationCenter.default.removeObserver(observer)
        notificationObserver = nil
        isListening = false
        
        print("SCGatewayEmitter: Stopped listening to notifications.")
    }
    
    private func getSCGatewayNotificationName() -> Notification.Name? {
        print("SCGatewayEmitter: Attempting to get SCGateway notification name.")
        // Method 1: Try to get SCGateway class using runtime
        if let scGatewayClass = NSClassFromString("SCGateway.SCGateway") as? NSObject.Type {
            print("SCGatewayEmitter: Found SCGateway.SCGateway class.")
            let sharedSelector = NSSelectorFromString("shared")
            if scGatewayClass.responds(to: sharedSelector) {
                if let shared = scGatewayClass.perform(sharedSelector)?.takeUnretainedValue() {
                    let notificationSelector = NSSelectorFromString("scgNotificationName")
                    if shared.responds(to: notificationSelector) {
                        if let result = shared.perform(notificationSelector)?.takeUnretainedValue() as? Notification.Name {
                            print("SCGatewayEmitter: Successfully retrieved notification name from SCGateway.SCGateway.")
                            return result
                        }
                    }
                }
            }
        }
        
        // Method 2: Try alternative class name
        if let scGatewayClass = NSClassFromString("SCGateway") as? NSObject.Type {
            print("SCGatewayEmitter: Found SCGateway class (alternative name).")
            let sharedSelector = NSSelectorFromString("shared")
            if scGatewayClass.responds(to: sharedSelector) {
                if let shared = scGatewayClass.perform(sharedSelector)?.takeUnretainedValue() {
                    let notificationSelector = NSSelectorFromString("scgNotificationName")
                    if shared.responds(to: notificationSelector) {
                        if let result = shared.perform(notificationSelector)?.takeUnretainedValue() as? Notification.Name {
                            print("SCGatewayEmitter: Successfully retrieved notification name from SCGateway (alternative name).")
                            return result
                        }
                    }
                }
            }
        }
        
        // Method 3: Fallback to hardcoded notification name
        print("SCGatewayEmitter: Falling back to hardcoded notification name: SCGatewayAnalyticsNotification.")
        return Notification.Name("SCGatewayAnalyticsNotification")
    }
    
    private func handleSCGatewayNotification(_ notification: Notification) {
        print("SCGatewayEmitter: Handling SCGateway notification.")
        guard let jsonString = notification.object as? String else {
            print("SCGatewayEmitter: Invalid notification object - expected JSON string, got: \(type(of: notification.object)).")
            return
        }
        print("SCGatewayEmitter: Received JSON string: \(jsonString).")
        
        // Parse the JSON string to extract notification details
        guard let notificationData = parseNotificationJSON(jsonString) else {
            print("SCGatewayEmitter: Failed to parse notification JSON: \(jsonString).")
            return
        }
        print("SCGatewayEmitter: Successfully parsed notification data: \(notificationData).")
        
        // Map notification type to React Native event name
        let eventName: String = mapNotificationTypeToEventName(notificationData["type"] as? String)
        print("SCGatewayEmitter: Mapped notification type to event name: \(eventName).")
        
        // Emit the event to React Native
        sendEvent(withName: eventName, body: notificationData)
        
        print("SCGatewayEmitter: Emitted event '\(eventName)' with data: \(notificationData).")
    }
    
    private func parseNotificationJSON(_ jsonString: String) -> [String: Any]? {
        print("SCGatewayEmitter: Parsing notification JSON string.")
        guard let jsonData = jsonString.data(using: .utf8) else {
            print("SCGatewayEmitter: Could not convert JSON string to data.")
            return nil
        }
        
        do {
            let parsedObject = try JSONSerialization.jsonObject(with: jsonData, options: []) as? [String: Any]
            print("SCGatewayEmitter: JSON parsing successful.")
            return parsedObject
        } catch {
            print("SCGatewayEmitter: JSON parsing error: \(error).")
            return nil
        }
    }
    
   private func mapNotificationTypeToEventName(_ type: String?) -> String {
    print("SCGatewayEmitter: Mapping notification type to event name. Type: \(type ?? "nil").")
    
    guard let rawType = type else {
        print("SCGatewayEmitter: No event type found, using unknown_event.")
        return "scgateway_unknown_event"
    }

    let trimmedType = rawType.trimmingCharacters(in: .whitespacesAndNewlines)
    print("SCGatewayEmitter: Trimmed event type: '\(trimmedType)'")

    switch trimmedType {
    case "scgateway_analytics_event":
        print("SCGatewayEmitter: Mapped to analytics_event.")
        return "scgateway_analytics_event"
    case "scgateway_analytics_super_properties_updated":
        print("SCGatewayEmitter: Mapped to super_properties_updated.")
        return "scgateway_super_properties_updated"
    case "scgateway_user_reset":
        print("SCGatewayEmitter: Mapped to user_reset.")
        return "scgateway_user_reset"
    case "scgateway_user_identify":
        print("SCGatewayEmitter: Mapped to user_identify.")
        return "scgateway_user_identify"
    default:
        print("SCGatewayEmitter: Unknown event type: \(trimmedType), using unknown_event.")
        return "scgateway_unknown_event"
    }
}

    
    // MARK: - Static Helper Methods for External Access
    
    static func emitEvent(name: String, data: [String: Any]) {
        print("SCGatewayEmitter: Static emitEvent called for event: \(name).")
        DispatchQueue.main.async {
            shared?.sendEvent(withName: name, body: data)
            print("SCGatewayEmitter: Event '\(name)' sent to React Native.")
        }
    }
    
    static func isCurrentlyListening() -> Bool {
        let status = shared?.isListening ?? false
        print("SCGatewayEmitter: isCurrentlyListening called. Status: \(status).")
        return status
    }
    
    // MARK: - Debug Methods
    
    @objc func getDebugInfo(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        print("SCGatewayEmitter: getDebugInfo called.")
        let debugInfo: [String: Any] = [
            "isListening": isListening,
            "hasObserver": notificationObserver != nil,
            "supportedEvents": supportedEvents() ?? [],
            "scgatewayClassExists": NSClassFromString("SCGateway.SCGateway") != nil || NSClassFromString("SCGateway") != nil,
            "notificationName": getSCGatewayNotificationName()?.rawValue ?? "unknown"
        ]
        print("SCGatewayEmitter: Debug info: \(debugInfo).")
        resolve(debugInfo)
    }
}