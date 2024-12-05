//
//  EventBridge.swift
//  SmallcaseGateway
//
//  Created by Aaditya Singh on 19/11/24.
//  Copyright © 2024 Facebook. All rights reserved.
//

import Combine
import React
import SCGateway

struct MixpanelConstants {
    static let EVENT_TRANSACTION_TRIGGERED = "SDK - Transaction triggered"
    static let EVENT_GATEWAY_CONNECT_VIEWED = "SDK - Gateway connect viewed"
    static let EVENT_BROKER_CHOOSER_VIEWED = "SDK - Broker-chooser viewed"
    static let EVENT_BROKER_SELECTED = "SDK - Broker selected"
    static let EVENT_NATIVE_APP_LAUNCHED = "SDK - Native App Launched"
    static let EVENT_NATIVE_LOGIN_FALLBACK = "SDK - Triggered native login fallback"
    static let EVENT_NATIVE_LOGIN_FALLBACK_USER_CANCELLED = "SDK - User closed"
    static let EVENT_BROKER_PLATFORM_OPENED = "SDK - Broker Platform Opened"
    static let EVENT_BROKER_PLATFORM_LOADED = "SDK - Broker Platform Loaded"
    static let EVENT_TRANSACTION_STATUS_FETCHED = "SDK - Transaction Status Fetched"
    static let EVENT_SDK_INTENT_RETURNED = "SDK - Intent Returned"
    static let EVENT_BP_RESPONSE_TO_PARTNER = "SDK - Response to partner"
    static let EVENT_LAUNCHED_LEAD_GEN_FROM_BROKER_CHOOSER = "SDK - Launched LeadGen from broker chooser"
    static let EVENT_DEVICE_BACK_BUTTON_CLICKED = "SDK - Device Back Button Clicked"
    static let EVENT_USER_CLOSED = "SDK - User closed"
}

@objc(EventBridge)
class EventBridge: RCTEventEmitter {
    private var cancellable: AnyCancellable?

    override init() {
        super.init()

        print("AD::: EventBridge has been initialized")
        // Observe the Combine publisher
        cancellable = EventPublisher.shared.eventSubject
            .sink { [weak self] event in
                self?.sendEventToReactNative(event: event)
            }
    }

     func sendEventToReactNative(event: [String: Any]) {
         if let bridge = bridge {
             self.sendEvent(withName: event["eventName"] as? String ?? "unknownEvent", body: event)
       }
    }
    
    // MARK: - Required Methods
    override func supportedEvents() -> [String]! {
        return [
    MixpanelConstants.EVENT_TRANSACTION_TRIGGERED,
    MixpanelConstants.EVENT_GATEWAY_CONNECT_VIEWED,
    MixpanelConstants.EVENT_BROKER_CHOOSER_VIEWED,
    MixpanelConstants.EVENT_BROKER_SELECTED,
    MixpanelConstants.EVENT_BROKER_PLATFORM_OPENED,
    MixpanelConstants.EVENT_SDK_INTENT_RETURNED,
    MixpanelConstants.EVENT_BP_RESPONSE_TO_PARTNER,
    MixpanelConstants.EVENT_LAUNCHED_LEAD_GEN_FROM_BROKER_CHOOSER,
    MixpanelConstants.EVENT_USER_CLOSED,
    MixpanelConstants.EVENT_NATIVE_APP_LAUNCHED,
    MixpanelConstants.EVENT_NATIVE_LOGIN_FALLBACK,
    MixpanelConstants.EVENT_NATIVE_LOGIN_FALLBACK_USER_CANCELLED,
    MixpanelConstants.EVENT_BROKER_PLATFORM_LOADED,
    MixpanelConstants.EVENT_TRANSACTION_STATUS_FETCHED,
    MixpanelConstants.EVENT_DEVICE_BACK_BUTTON_CLICKED
]

    }

    deinit {
        cancellable?.cancel()
    }
}
