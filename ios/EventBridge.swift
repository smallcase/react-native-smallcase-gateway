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
        return ["sample"] // List of event names
    }

    deinit {
        cancellable?.cancel()
    }
}
