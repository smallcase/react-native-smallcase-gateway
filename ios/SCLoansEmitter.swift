import Foundation
import React

@objc(SCLoansEmitter)
class SCLoansEmitter: RCTEventEmitter {

  private struct Constants {
    static let loanNotification = "scloans_notification"
    static let payloadKey = "payload"
    static let stringifiedPayloadKey = "payload_str"
  }

  private static var shared: SCLoansEmitter?

  private var notificationObserver: NSObjectProtocol?

  private var isListening: Bool {
    return notificationObserver != nil
  }

  override init() {
    super.init()
    SCLoansEmitter.shared = self
    print("SCLoansEmitter: Initialized.")
    startListening()
  }

  deinit {
    print("SCLoansEmitter: Deinitializing.")
    stopListening()
  }

  override func supportedEvents() -> [String]! {
    return [Constants.loanNotification]
  }

  override func startObserving() {
    super.startObserving()
    print("SCLoansEmitter: startObserving called.")
    startListening()
  }

  override func stopObserving() {
    super.stopObserving()
    print("SCLoansEmitter: stopObserving called.")
    stopListening()
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

      let notificationName = Notification.Name(Constants.loanNotification)

      self.notificationObserver = NotificationCenter.default.addObserver(
        forName: notificationName,
        object: nil,
        queue: .main
      ) { [weak self] notification in
        self?.processScLoansNotification(notification)
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

  private func processScLoansNotification(_ notification: Notification) {
    let userInfo = notification.userInfo ?? [:]

    print("SCLoansEmitter: Received notification with userInfo keys: \(userInfo.keys)")

    guard let jsonString = userInfo[Constants.stringifiedPayloadKey] as? String else {
      print(
        "SCLoansEmitter: No stringified payload found with key '\(Constants.stringifiedPayloadKey)'"
      )
      return
    }

    print("SCLoansEmitter: Received JSON string: \(jsonString).")
    sendEvent(withName: Constants.loanNotification, body: jsonString)
    print("SCLoansEmitter: Emitted event '\(Constants.loanNotification)' with JSON string.")
  }
}
