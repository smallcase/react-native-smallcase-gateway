import Foundation
import React

@objc(SCLoansEmitter)
class SCLoansEmitter: RCTEventEmitter {
  
  private static var shared: SCLoansEmitter?
  private var notificationObserver: NSObjectProtocol?
  
  // Computed property for listening status
  private var isListening: Bool {
    return notificationObserver != nil
  }
  
  private struct SCLoansNotificationConstants {
    static let loanNotification = "scloans_notification"
    static let userReset = "scloans_user_reset"
    static let userIdentify = "scloans_user_identify"
    static let payloadKey = "payload"
    static let stringifiedPayloadKey = "payload_str"
    
    // Analytics constants
    static let analyticsEvent = "scloans_analytics_event"
    static let superPropertiesUpdated = "scloans_super_properties_updated"
  }
  
  override init() {
    super.init()
    SCLoansEmitter.shared = self
    print("SCLoansEmitter: Initialized.")
    self.startListening()
  }
  
  deinit {
    print("SCLoansEmitter: Deinitializing.")
    self.stopListening()
  }
  
  override func supportedEvents() -> [String]! {
    return [SCLoansNotificationConstants.loanNotification]
  }
  
  // Export constants to React Native
  @objc static func constantsToExport() -> [String: Any]! {
    return [
      "ANALYTICS_EVENT": SCLoansNotificationConstants.analyticsEvent,
      "SUPER_PROPERTIES_UPDATED": SCLoansNotificationConstants.superPropertiesUpdated
    ]
  }
  
  override func startObserving() {
    super.startObserving()
    print("SCLoansEmitter: startObserving called.")
    self.startListening()
  }
  
  override func stopObserving() {
    super.stopObserving()
    print("SCLoansEmitter: stopObserving called.")
    self.stopListening()
  }
  
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  @objc func startListening(
    _ resolve: RCTPromiseResolveBlock? = nil,
    rejecter reject: RCTPromiseRejectBlock? = nil
  ) {
    print("SCLoansEmitter: Starting to listen for notifications.")
    
    guard !isListening else {
      print("SCLoansEmitter: Already listening.")
      resolve?("Already listening")
      return
    }
    
    DispatchQueue.main.async { [weak self] in
      guard let self = self else {
        reject?("START_LISTENING_FAILED", "Self deallocated", nil)
        return
      }
      
      self.stopListening()
      
      let notificationName = Notification.Name(SCLoansNotificationConstants.loanNotification)
      
      self.notificationObserver = NotificationCenter.default.addObserver(
        forName: notificationName,
        object: nil,
        queue: .main
      ) { [weak self] notification in
        self?.handleLoanNotification(notification)
      }
      
      print("SCLoansEmitter: Listening to \(notificationName.rawValue)")
      resolve?("Started listening to SCLoans events")
    }
  }
  
  @objc func stopListening(
    _ resolve: RCTPromiseResolveBlock? = nil,
    rejecter reject: RCTPromiseRejectBlock? = nil
  ) {
    print("SCLoansEmitter: Stopping listening for notifications.")
    
    guard isListening, let observer = notificationObserver else { 
      print("SCLoansEmitter: Not listening or no observer, no action needed.")
      resolve?("Not listening")
      return 
    }
    
    NotificationCenter.default.removeObserver(observer)
    notificationObserver = nil
    
    print("SCLoansEmitter: Stopped listening.")
    resolve?("Stopped listening to SCLoans events")
  }
  
  private func handleLoanNotification(_ notification: Notification) {
    let userInfo = notification.userInfo ?? [:]
    
    print("SCLoansEmitter: Received notification with userInfo keys: \(userInfo.keys)")
    
    // Get the stringified payload and pass it directly
    guard let jsonString = userInfo[SCLoansNotificationConstants.stringifiedPayloadKey] as? String else {
      print("SCLoansEmitter: No stringified payload found with key '\(SCLoansNotificationConstants.stringifiedPayloadKey)'")
      return
    }
    
    print("SCLoansEmitter: Received JSON string: \(jsonString).")
    sendEvent(withName: SCLoansNotificationConstants.loanNotification, body: jsonString)
    print("SCLoansEmitter: Emitted event '\(SCLoansNotificationConstants.loanNotification)' with JSON string.")
  }
  
  // MARK: - Static API (Optional External Access)
  
  static func emitEvent(name: String, data: [String: Any]) {
    DispatchQueue.main.async {
      if let shared = shared {
        shared.sendEvent(withName: SCLoansNotificationConstants.loanNotification, body: data)
        print("SCLoansEmitter: Static event '\(name)' sent to React Native.")
      } else {
        print("SCLoansEmitter: Cannot send static event - emitter not initialized.")
      }
    }
  }
  
  static func isCurrentlyListening() -> Bool {
    return shared?.isListening ?? false
  }
}