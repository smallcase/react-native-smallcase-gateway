//
//  SCGatewayBridgeEmitter.m
//  SCGateway
//
//  Created by Dhruv Porwal
//  Copyright © 2025 smallcase. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import "SmallcaseGateway-Bridging-Header.h"

@interface RCT_EXTERN_REMAP_MODULE(SCLoansBridgeEmitter, SCLoansEmitter, NSObject)
// naming should be diff 
RCT_EXTERN_METHOD(startListening:(RCTPromiseResolveBlock)resolve // check by removing this
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopListening:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getDebugInfo:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end