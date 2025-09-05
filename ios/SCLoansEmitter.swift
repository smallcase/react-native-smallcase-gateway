import Foundation
import React

@objc(SCLoansEmitter)
class SCLoansEmitter: RCTEventEmitter {
  
  private static var shared: SCLoansEmitter?
  private var isListening = false
  private var notificationObserver: NSObjectProtocol?
  private struct SCLoansNotificationConstants {
    static let loanNotification = "scloans_notification"
    static let userReset = "scloans_user_reset"
    static let userIdentify = "scloans_user_identify"
    static let payloadKey = "payload"
    static let strigifiedPayloadKey = "payload_str"
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
    return [
      SCLoansNotificationConstants.loanNotification,
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
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    print("SCLoansEmitter: React Native requested startListening.")
    DispatchQueue.main.async { [weak self] in
      let success = self?.startListening() ?? false
      success
      ? resolve("Started listening to SCLoans events")
      : reject("START_LISTENING_FAILED", "Failed to start listening to SCLoans events", nil)
    }
  }
  
  @objc func stopListening(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    print("SCLoansEmitter: React Native requested stopListening.")
    DispatchQueue.main.async { [weak self] in
      self?.stopListening()
      resolve("Stopped listening to SCLoans events")
    }
  }
  
  // MARK: - Private Methods
  
  @discardableResult
  private func startListening() -> Bool {
    guard !isListening else {
      print("SCLoansEmitter: Already listening.")
      return true
    }
    
    self.stopListening()
    
    let notificationName = Notification.Name(SCLoansNotificationConstants.loanNotification)
    
    notificationObserver = NotificationCenter.default.addObserver(
      forName: notificationName,
      object: nil,
      queue: .main
    ) { [weak self] notification in
      self?.handleLoanNotification(notification)
    }
    
    isListening = true
    print("SCLoansEmitter: Listening to \(notificationName.rawValue)")
    return true
  }
  
  private func stopListening() {
    guard isListening, let observer = notificationObserver else { return }
    
    NotificationCenter.default.removeObserver(observer)
    notificationObserver = nil
    isListening = false
    
    print("SCLoansEmitter: Stopped listening.")
  }
  
  private func handleLoanNotification(_ notification: Notification) {
    let name = notification.name.rawValue
    let userInfo = notification.userInfo ?? [:]
    
    print("📡 handleLoanNotification triggered:")
    print("🔹 name: \(name)")
    print("🔹 userInfo keys: \(userInfo.keys)")
    
    // Try to get the stringified payload using our local constant
    guard let jsonString = userInfo[SCLoansNotificationConstants.strigifiedPayloadKey] as? String else {
      print("SCLoansEmitter: No stringified payload found with key '\(SCLoansNotificationConstants.strigifiedPayloadKey)'")
      
      // Fallback: try to find any string value in userInfo that could be JSON
      if let foundJsonString = findJsonStringInUserInfo(userInfo) {
        print("SCLoansEmitter: Found potential JSON string in userInfo")
        processJsonString(foundJsonString)
        return
      }
      
      // Final fallback: try the regular payload key
      if let payloadData = userInfo[SCLoansNotificationConstants.payloadKey] {
        print("SCLoansEmitter: Found payload data with key '\(SCLoansNotificationConstants.payloadKey)': \(type(of: payloadData))")
        processPayloadData(payloadData)
        return
      }
      
      print("SCLoansEmitter: No valid payload found in notification")
      return
    }
    
    processJsonString(jsonString)
  }
  
  private func findJsonStringInUserInfo(_ userInfo: [AnyHashable: Any]) -> String? {
    for (key, value) in userInfo {
      if let stringValue = value as? String,
         stringValue.trimmingCharacters(in: .whitespacesAndNewlines).hasPrefix("{") {
        print("SCLoansEmitter: Found JSON-like string with key '\(key)'")
        return stringValue
      }
    }
    return nil
  }
  
  private func processJsonString(_ jsonString: String) {
    guard let data = parseJSON(jsonString) else {
      print("SCLoansEmitter: Failed to parse JSON string: \(jsonString)")
      return
    }
    
    let eventType = SCLoansNotificationConstants.loanNotification
    
    // Only send events that are in our supportedEvents list
    let supportedEventsList = supportedEvents() ?? []
    if supportedEventsList.contains(eventType) {
      self.sendEvent(withName: eventType, body: data)
      print("SCLoansEmitter: Emitted event '\(eventType)' with data: \(data).")
    } else {
      print("SCLoansEmitter: Skipping unsupported event type: \(eventType)")
    }
  }
  
  private func processPayloadData(_ payloadData: Any) {
    var data: [String: Any] = [:]
    
    if let dictData = payloadData as? [String: Any] {
      data = dictData
    } else if let stringData = payloadData as? String {
      data = parseJSON(stringData) ?? ["raw_payload": stringData]
    } else {
      data = ["raw_payload": String(describing: payloadData)]
    }
    
    let eventType = SCLoansNotificationConstants.loanNotification
    let supportedEventsList = supportedEvents() ?? []
    
    if supportedEventsList.contains(eventType) {
      self.sendEvent(withName: eventType, body: data)
      print("SCLoansEmitter: Emitted event '\(eventType)' with processed data: \(data).")
    }
  }
  
  private func parseJSON(_ json: String) -> [String: Any]? {
    guard let jsonData = json.data(using: .utf8) else { 
      print("SCLoansEmitter: Failed to convert string to data")
      return nil 
    }
    
    do {
      let parsed = try JSONSerialization.jsonObject(with: jsonData, options: [])
      return parsed as? [String: Any]
    } catch {
      print("SCLoansEmitter: JSON parsing error: \(error)")
      return nil
    }
  }
  
  // MARK: - Static API (Optional External Access)
  
  static func emitEvent(name: String, data: [String: Any]) {
    DispatchQueue.main.async {
      let eventType = SCLoansNotificationConstants.loanNotification
      let supportedEventsList = shared?.supportedEvents() ?? []
      
      if supportedEventsList.contains(eventType) {
        shared?.sendEvent(withName: eventType, body: data)
        print("SCLoansEmitter: Static event '\(name)' sent to React Native as '\(eventType)'.")
      } else {
        print("SCLoansEmitter: Skipping unsupported static event: \(name)")
      }
    }
  }
  
  static func isCurrentlyListening() -> Bool {
    return shared?.isListening ?? false
  }
}