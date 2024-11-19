//
//  EventBridge.m
//  SmallcaseGateway
//
//  Created by Aaditya Singh on 20/11/24.
//  Copyright © 2024 Facebook. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(EventBridge, RCTEventEmitter)
 RCT_EXTERN_METHOD(supportedEvents)
@end
