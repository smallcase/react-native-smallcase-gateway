//
//  EventBridge.swift
//  SmallcaseGateway
//
//  Created by Aaditya Singh on 19/11/24.
//  Copyright © 2024 Facebook. All rights reserved.
//

import Combine
import React

final class EventPublisher {
    static let shared = EventPublisher()
    let eventSubject = PassthroughSubject<[String: Any], Never>()

    private init() {}
}

@objc(EventBridge)
class EventBridge: RCTEventEmitter {
    private var cancellable: AnyCancellable?

    override init() {
        super.init()

        // Observe the Combine publisher
        cancellable = EventPublisher.shared.eventSubject
            .sink { [weak self] event in
                self?.sendEventToReactNative(event: event)
            }
    }

    private func sendEventToReactNative(event: [String: Any]) {
        // Pass the event to React Native via RCTEventEmitter
        if let bridge = bridge {
            sendEvent(withName: event["eventName"] as? String ?? "unknownEvent", body: event)
        }
    }
    
    // MARK: - Required Methods
    override func supportedEvents() -> [String]! {
        return ["SDK - Transaction triggered"] // List of event names
    }

    deinit {
        cancellable?.cancel()
    }
}
