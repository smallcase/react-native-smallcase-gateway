import Foundation
import React
import SCGateway

@objc(SCGatewayEmitter)
class SCGatewayEmitter: RCTEventEmitter {
  
  private static var shared: SCGatewayEmitter?
  private var notificationObserver: NSObjectProtocol?
  
  private var isListening: Bool {
    return notificationObserver != nil
  }
  
  private struct SCGatewayNotificationConstants {
    static let payloadKey = "payload"
    static let stringifiedPayloadKey = "payload_str"
    static let scgNotificationName = "scg_notification"
    
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
    stopListening()
  }
  
  override func supportedEvents() -> [String]! {
    return [SCGatewayNotificationConstants.scgNotificationName]
  }
  
  @objc static func constantsToExport() -> [String: Any]! {
    return [
      "ANALYTICS_EVENT": SCGatewayNotificationConstants.analyticsEvent,
      "SUPER_PROPERTIES_UPDATED": SCGatewayNotificationConstants.superPropertiesUpdated,
      "USER_RESET": SCGatewayNotificationConstants.userReset,
      "USER_IDENTIFY": SCGatewayNotificationConstants.userIdentify
    ]
  }
  
  override func startObserving() {
    super.startObserving()
    print("SCGatewayEmitter: React Native bridge startObserving called.")
    startListening()
  }
  
  override func stopObserving() {
    super.stopObserving()
    print("SCGatewayEmitter: React Native bridge stopObserving called.")
    stopListening()
  }
  
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  @objc func startListening(
    _ resolve: RCTPromiseResolveBlock? = nil,
    rejecter reject: RCTPromiseRejectBlock? = nil
  ) {
    print("SCGatewayEmitter: Starting to listen for notifications.")
    
    guard !isListening else {
      print("SCGatewayEmitter: Already listening, no action needed.")
      resolve?("Already listening")
      return
    }
    
    DispatchQueue.main.async { [weak self] in
      guard let self = self else {
        reject?("START_LISTENING_FAILED", "Self deallocated", nil)
        return
      }
      
      self.stopListening()
      
      self.notificationObserver = NotificationCenter.default.addObserver(
        forName: Notification.Name(SCGatewayNotificationConstants.scgNotificationName),
        object: nil,
        queue: .main
      ) { [weak self] notification in
        self?.handleSCGatewayNotification(notification)
      }
      
      print("SCGatewayEmitter: Started listening to notifications with name: \(SCGatewayNotificationConstants.scgNotificationName).")
      resolve?("Started listening to SCGateway events")
    }
  }
  
  @objc func stopListening(
    _ resolve: RCTPromiseResolveBlock? = nil,
    rejecter reject: RCTPromiseRejectBlock? = nil
  ) {
    print("SCGatewayEmitter: Stopping listening for notifications.")
    
    guard isListening, let observer = notificationObserver else {
      print("SCGatewayEmitter: Not listening or no observer, no action needed.")
      resolve?("Not listening")
      return
    }
    
    NotificationCenter.default.removeObserver(observer)
    notificationObserver = nil
    
    print("SCGatewayEmitter: Stopped listening to notifications.")
    resolve?("Stopped listening to SCGateway events")
  }
  
  private func handleSCGatewayNotification(_ notification: Notification) {
    let userInfo = notification.userInfo ?? [:]
    
    print("SCGatewayEmitter: Received notification with userInfo keys: \(userInfo.keys)")
    
    guard let jsonString = userInfo[SCGatewayNotificationConstants.stringifiedPayloadKey] as? String else {
      print("SCGatewayEmitter: No stringified payload found with key '\(SCGatewayNotificationConstants.stringifiedPayloadKey)'")
      return
    }
    
    print("SCGatewayEmitter: Received JSON string: \(jsonString).")
    sendEvent(withName: SCGatewayNotificationConstants.scgNotificationName, body: jsonString)
    print("SCGatewayEmitter: Emitted event '\(SCGatewayNotificationConstants.scgNotificationName)' with JSON string.")
  }
  
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
}
