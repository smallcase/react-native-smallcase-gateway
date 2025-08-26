import Foundation
import React

@objc(SCLoansEmitter)
class SCLoansEmitter: RCTEventEmitter {
  
  // MARK: - Static Properties
  private static var shared: SCLoansEmitter?
  private var isListening = false
  private var notificationObserver: NSObjectProtocol?
  
  // MARK: - Lifecycle
  override init() {
    super.init()
    SCLoansEmitter.shared = self
    print("SCLoansEmitter: Initialized.")
  }
  
  deinit {
    print("SCLoansEmitter: Deinitializing.")
    self.stopListening()
  }
  
  // MARK: - RCTEventEmitter Overrides
  
  override func supportedEvents() -> [String]! {
    return [
      "scloans_notification",
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
  
  // MARK: - Public Methods (Exposed to React Native)
  
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
  
  @objc func getDebugInfo(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let debugInfo: [String: Any] = [
      "isListening": isListening,
      "hasObserver": notificationObserver != nil,
      "supportedEvents": supportedEvents() ?? [],
      "notificationName": "scloans_notification"
    ]
    print("SCLoansEmitter: Debug info: \(debugInfo).")
    resolve(debugInfo)
  }
  
  // MARK: - Private Methods
  
  @discardableResult
  private func startListening() -> Bool { // add observer(startListening) in init and remove in deinit(stopListening)
    guard !isListening else {
      print("SCLoansEmitter: Already listening.")
      return true
    }
    
    self.stopListening()
    
    let notificationName = Notification.Name("scloans_notification")
    
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
       //let userInfo = notification.userInfo ?? [:]
       // we can have a simple logic like first check if userInfo is empty or not, if not empty then try to look out for key like we can see which value of traversed key is a string. that is supposed to be our json string. use that key to access value from userInfo Dict of incoming notification event
//       let userInfoString: String
//       if let data = try? JSONSerialization.data(withJSONObject: userInfo, options: .prettyPrinted),
//          let jsonString = String(data: data, encoding: .utf8) {
//           userInfoString = jsonString
//       } else {
//           userInfoString = userInfo.description
//       }
       
       print("📡 handleLoanNotification triggered:")
       print("🔹 name: \(name)")
      // print("🔹 userInfo:\n\(userInfoString)")
  
    guard let jsonString = notification.userInfo?["payload_str"] as? String else {
          print("SCLoansEmitter: Invalid notification object - expected JSON string, got: \(type(of: notification.userInfo)).")
          return
      }
    
    guard let data = parseJSON(jsonString) else {
      print("SCLoansEmitter: Failed to parse JSON string.")
      return
    }
    
    let type = "scloans_notification" // data["type"] as? String ??
    
    // Only send events that are in our supportedEvents list
    let supportedEventsList = supportedEvents() ?? []
    if supportedEventsList.contains(type) {
      self.sendEvent(withName: type, body: data)
      print("SCLoansEmitter: Emitted event '\(type)' with data: \(data).")
    } else {
      print("SCLoansEmitter: Skipping unsupported event type: \(type)")
    }
  }
  
  private func parseJSON(_ json: String) -> [String: Any]? {
    guard let jsonData = json.data(using: .utf8) else { return nil }
    
    do {
      return try JSONSerialization.jsonObject(with: jsonData, options: []) as? [String: Any]
    } catch {
      print("SCLoansEmitter: JSON parsing error: \(error)")
      return nil
    }
  }
  
  // MARK: - Static API (Optional External Access)
  
  static func emitEvent(name: String, data: [String: Any]) {
    DispatchQueue.main.async {
      let supportedEventsList = shared?.supportedEvents() ?? []
      if supportedEventsList.contains(name) {
        shared?.sendEvent(withName: name, body: data)
        print("SCLoansEmitter: Event '\(name)' sent to React Native.")
      } else {
        print("SCLoansEmitter: Skipping unsupported static event: \(name)")
      }
    }
  }
  
  static func isCurrentlyListening() -> Bool {
    return shared?.isListening ?? false
  }
}
