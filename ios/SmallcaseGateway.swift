import Foundation
import UIKit
import React
import SCGateway

@objc(SmallcaseGateway)
class SmallcaseGateway: RCTEventEmitter {
    private var hasMfListeners = false
    private var checkoutReplies: [String: (String, [String: Any]) -> Void] = [:]

    @objc(sendMutualFundCheckoutEvent:checkoutId:event:data:resolver:rejecter:)
    func sendMutualFundCheckoutEvent(_ launchId: String, checkoutId: String, event: String, data: [String: Any],
                                    resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
        guard let reply = checkoutReplies["\(launchId):\(checkoutId)"] else { resolve(false); return }
        reply(event, data)
        resolve(true)
    }

    override func invalidate() {
        checkoutReplies.removeAll()
        super.invalidate()
    }

    override var methodQueue: DispatchQueue! { DispatchQueue.main }
    override static func requiresMainQueueSetup() -> Bool { true }
    override func supportedEvents() -> [String]! { ["scg_mf_order_event"] }
    override func startObserving() { hasMfListeners = true }
    override func stopObserving() { hasMfListeners = false }

    @objc(launchMutualFundOrder:resolver:rejecter:)
    func launchMutualFundOrder(_ options: [String: Any],
                              resolver resolve: @escaping RCTPromiseResolveBlock,
                              rejecter reject: @escaping RCTPromiseRejectBlock) {
        Task { @MainActor in
            guard let transactionId = options["transactionId"] as? String,
                  let launchId = options["launchId"] as? String, !launchId.isEmpty else {
                resolve(["success": false, "reason": "launch_error", "errorCode": "INVALID_CONFIG"])
                return
            }
            let window = UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .filter { $0.activationState == .foregroundActive }
                .flatMap { $0.windows }.first { $0.isKeyWindow }
                ?? UIApplication.shared.windows.first { $0.isKeyWindow }
            guard var presenter = window?.rootViewController else {
                resolve(["success": false, "reason": "launch_error", "errorCode": "NO_ACTIVITY"])
                return
            }
            while let presented = presenter.presentedViewController, !presented.isBeingDismissed {
                presenter = presented
            }
            var analytics: (([MutualFundAnalyticsEvent]) -> Void)?
            if options["hasAnalyticsListener"] as? Bool == true {
                analytics = { [weak self] events in
                    let payload = events.map { event -> [String: Any] in
                        var result: [String: Any] = ["label": event.label, "integrations": event.integrations]
                        if let data = event.data { result["data"] = data }
                        return result
                    }
                    self?.emitMfOrderEvent(launchId: launchId, type: "ANALYTICS_EVENT", payload: ["events": payload])
                }
            }
            var checkout: ((String, [String: Any], @escaping (String, [String: Any]) -> Void) -> (() -> Void))?
            if options["hasCheckoutHandler"] as? Bool == true {
                checkout = { [weak self] checkoutId, config, emit in
                    let key = "\(launchId):\(checkoutId)"
                    self?.checkoutReplies[key] = emit
                    self?.emitMfOrderEvent(launchId: launchId, type: "CHECKOUT_OPEN", payload: ["checkoutId": checkoutId, "config": config])
                    return { [weak self] in
                        self?.checkoutReplies.removeValue(forKey: key)
                        self?.emitMfOrderEvent(launchId: launchId, type: "CHECKOUT_DISMISS", payload: ["checkoutId": checkoutId])
                    }
                }
            }
            let result = await SCGateway.shared.launchMutualFundOrder(MutualFundOrderOptions(
                presentingController: presenter, transactionId: transactionId,
                metadata: options["metadata"] as? [String: Any] ?? [:],
                webclientUrl: options["webclientUrl"] as? String,
                onAnalyticsEvent: analytics,
                onCheckout: checkout,
                onNativeAction: { [weak self] intent, metadata in
                    var payload: [String: Any] = ["intent": intent]
                    if let metadata = metadata { payload["metadata"] = metadata }
                    self?.emitMfOrderEvent(launchId: launchId, type: "NATIVE_ACTION", payload: payload)
                }
            ))
            var response: [String: Any] = ["success": result.success, "reason": result.reason]
            if let intent = result.intent { response["intent"] = intent }
            if let data = result.data { response["data"] = data }
            if let error = result.error { response["error"] = error }
            if let errorCode = result.errorCode { response["errorCode"] = errorCode }
            resolve(response)
        }
    }

    private func emitMfOrderEvent(launchId: String, type: String, payload: [String: Any]) {
        guard hasMfListeners else { return }
        var event = payload
        event["launchId"] = launchId
        event["type"] = type
        sendEvent(withName: "scg_mf_order_event", body: event)
    }
}
