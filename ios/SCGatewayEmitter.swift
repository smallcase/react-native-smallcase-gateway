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
    return [SCGateway.scgNotificationName.rawValue]
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
        forName: SCGateway.scgNotificationName,
        object: nil,
        queue: .main
      ) { [weak self] notification in
        self?.processScgNotification(notification)
      }

      print(
        "SCGatewayEmitter: Started listening to notifications with name: \(SCGateway.scgNotificationName.rawValue)."
      )
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

  private func processScgNotification(_ notification: Notification) {
    let userInfo = notification.userInfo ?? [:]

    print("SCGatewayEmitter: Received notification with userInfo keys: \(userInfo.keys)")

    guard let jsonString = userInfo[SCGNotification.strigifiedPayloadKey] as? String else {
      print(
        "SCGatewayEmitter: No stringified payload found with key '\(SCGNotification.strigifiedPayloadKey)'"
      )
      return
    }

    print("SCGatewayEmitter: Received JSON string: \(jsonString).")
    sendEvent(withName: SCGateway.scgNotificationName.rawValue, body: jsonString)
    print("SCGatewayEmitter: Emitted event '\(SCGateway.scgNotificationName.rawValue)' with JSON string.")
  }
}
