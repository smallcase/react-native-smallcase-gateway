import Foundation
import React
import SCGateway

@objc(SCGatewayEmitter)
class SCGatewayEmitter: RCTEventEmitter {
    
    private static var shared: SCGatewayEmitter?
    private var isListening = false
    private var notificationObserver: NSObjectProtocol?
    
    // MARK: - Local Constants (copied from native SDK)
    private struct SCGatewayNotificationConstants {
        static let payloadKey = "payload"
        static let strigifiedPayloadKey = "payload_str"
        static let scgNotificationName = "scg_notification"
        
        // Notification types
        static let analyticsEvent = "scgateway_analytics_event"
        static let superPropertiesUpdated = "scgateway_super_properties_updated"
        static let userReset = "scgateway_user_reset"
        static let userIdentify = "scgateway_user_identify"
    }
    
    override init() {
        super.init()
        SCGatewayEmitter.shared = self
        print("SCGatewayEmitter: Initialized.")
    }
    
    deinit {
        print("SCGatewayEmitter: Deinitializing.")
        stopListeningToNotifications()
    }
    
    override func supportedEvents() -> [String]! {
        return [SCGatewayNotificationConstants.scgNotificationName]
    }
    
    override func startObserving() {
        super.startObserving()
        print("SCGatewayEmitter: React Native bridge startObserving called.")
        startListeningToNotifications()
    }
    
    override func stopObserving() {
        super.stopObserving()
        print("SCGatewayEmitter: React Native bridge stopObserving called.")
        stopListeningToNotifications()
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    @objc func startListening(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        print("SCGatewayEmitter: React Native requested startListening.")
        DispatchQueue.main.async { [weak self] in
            let success = self?.startListeningToNotifications() ?? false
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
            self?.stopListeningToNotifications()
            print("SCGatewayEmitter: Successfully stopped listening from React Native request.")
            resolve("Stopped listening to SCGateway events")
        }
    }
    
    @objc func getDebugInfo(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        let debugInfo: [String: Any] = [
            "isListening": isListening,
            "hasObserver": notificationObserver != nil,
            "supportedEvents": supportedEvents() ?? [],
            "notificationName": SCGatewayNotificationConstants.scgNotificationName,
            "payloadKey": SCGatewayNotificationConstants.payloadKey,
            "stringifiedPayloadKey": SCGatewayNotificationConstants.strigifiedPayloadKey,
            "scgNotificationName": SCGatewayNotificationConstants.scgNotificationName
        ]
        print("SCGatewayEmitter: Debug info: \(debugInfo).")
        resolve(debugInfo)
    }
    
    @discardableResult
    private func startListeningToNotifications() -> Bool {
        print("SCGatewayEmitter: Starting to listen for notifications.")
        
        guard !isListening else {
            print("SCGatewayEmitter: Already listening, no action needed.")
            return true
        }   
        
        self.stopListeningToNotifications()
        
        notificationObserver = NotificationCenter.default.addObserver(
            forName: Notification.Name(SCGatewayNotificationConstants.scgNotificationName),
            object: nil,
            queue: .main
        ) { [weak self] notification in
            self?.handleSCGatewayNotification(notification)
        }
        
        isListening = true
        print("SCGatewayEmitter: Started listening to notifications with name: \(SCGatewayNotificationConstants.scgNotificationName).")
        
        return true
    }
    
    private func stopListeningToNotifications() {
        print("SCGatewayEmitter: Stopping listening for notifications.")
        
        guard isListening, let observer = notificationObserver else { 
            print("SCGatewayEmitter: Not listening or no observer, no action needed.")
            return 
        }
        
        NotificationCenter.default.removeObserver(observer)
        notificationObserver = nil
        isListening = false
        
        print("SCGatewayEmitter: Stopped listening to notifications.")
    }
    
    private func handleSCGatewayNotification(_ notification: Notification) {
        let name = notification.name
        let userInfo = notification.userInfo ?? [:]
        
        print("📡 handleSCGatewayNotification triggered:")
        print("🔹 name: \(name)")
        print("🔹 userInfo keys: \(userInfo.keys)")
        
        // Try to get the stringified payload using our local constant
        guard let jsonString = userInfo[SCGatewayNotificationConstants.strigifiedPayloadKey] as? String else {
            print("SCGatewayEmitter: No stringified payload found with key '\(SCGatewayNotificationConstants.strigifiedPayloadKey)'")
            
            // Fallback: try to find any string value in userInfo that could be JSON
            if let foundJsonString = findJsonStringInUserInfo(userInfo) {
                print("SCGatewayEmitter: Found potential JSON string in userInfo")
                processJsonString(foundJsonString)
                return
            }
            
            // Final fallback: try the regular payload key
            if let payloadData = userInfo[SCGatewayNotificationConstants.payloadKey] {
                print("SCGatewayEmitter: Found payload data with key '\(SCGatewayNotificationConstants.payloadKey)': \(type(of: payloadData))")
                processPayloadData(payloadData)
                return
            }
            
            print("SCGatewayEmitter: No valid payload found in notification")
            return
        }
        
        print("SCGatewayEmitter: Received JSON string: \(jsonString).")
        processJsonString(jsonString)
    }
    
    private func findJsonStringInUserInfo(_ userInfo: [AnyHashable: Any]) -> String? {
        for (key, value) in userInfo {
            if let stringValue = value as? String,
               stringValue.trimmingCharacters(in: .whitespacesAndNewlines).hasPrefix("{") {
                print("SCGatewayEmitter: Found JSON-like string with key '\(key)'")
                return stringValue
            }
        }
        return nil
    }
    
    private func processJsonString(_ jsonString: String) {
        guard let notificationData = parseNotificationJSON(jsonString) else {
            print("SCGatewayEmitter: Failed to parse notification JSON: \(jsonString).")
            return
        }
        
        print("SCGatewayEmitter: Successfully parsed notification data: \(notificationData).")
        
        sendEvent(withName: SCGatewayNotificationConstants.scgNotificationName, body: notificationData)
        
        print("SCGatewayEmitter: Emitted event '\(SCGatewayNotificationConstants.scgNotificationName)' with data: \(notificationData).")
    }
    
    private func processPayloadData(_ payloadData: Any) {
        var data: [String: Any] = [:]
        
        if let dictData = payloadData as? [String: Any] {
            data = dictData
        } else if let stringData = payloadData as? String {
            data = parseNotificationJSON(stringData) ?? ["raw_payload": stringData]
        } else {
            data = ["raw_payload": String(describing: payloadData)]
        }
        
        sendEvent(withName: SCGatewayNotificationConstants.scgNotificationName, body: data)
        print("SCGatewayEmitter: Emitted event with processed data: \(data).")
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
    
    // MARK: - Static API (Optional External Access)
    
    static func emitEvent(name: String, data: [String: Any]) {
        DispatchQueue.main.async {
            if let shared = shared {
                shared.sendEvent(withName: SCGatewayNotificationConstants.scgNotificationName, body: data)
                print("SCGatewayEmitter: Static event '\(name)' sent to React Native.")
            } else {
                print("SCGatewayEmitter: Cannot send static event - emitter not initialized.")
            }
        }
    }
    
    static func isCurrentlyListening() -> Bool {
        return shared?.isListening ?? false
    }
}
