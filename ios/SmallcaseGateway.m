#import "SmallcaseGateway.h"

#import <SCGateway/SCGateway.h>
#import <SCGateway/SCGateway-Swift.h>


@implementation SmallcaseGateway

RCT_EXPORT_MODULE()

RCT_REMAP_METHOD(setHybridSdkVersion, sdkVersion: (NSString *)sdkVersion) {
    [SCGateway.shared setSDKTypeWithType:@"react-native"];
    [SCGateway.shared setHybridSDKVersionWithVersion:sdkVersion];
}

RCT_REMAP_METHOD(getSdkVersion,
                 reactNativeSdkVersion: (NSString *)reactNativeSdkVersion
                 initWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
    
    NSString *nativeSdkString = [NSString stringWithFormat: @"ios:%@", [SCGateway.shared getSdkVersion]];
    NSString *reactNativeSdkString = [NSString stringWithFormat: @",react-native:%@", reactNativeSdkVersion];
    
    NSString *result = [nativeSdkString stringByAppendingString: reactNativeSdkString];
    
    resolve(result);
}

RCT_REMAP_METHOD(setConfigEnvironment,
                 envName:(NSString *)envName
                 gateway:(NSString *)gateway
                 isLeprechaunActive: (BOOL *)isLeprechaunActive
                 isAmoEnabled: (BOOL *)isAmoEnabled
                 preProvidedBrokers: (NSArray *)preProvidedBrokers
                 setConfigEnvironmentWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    NSInteger environment = EnvironmentProduction;

    if([envName isEqualToString:@"production"]) {
        environment = EnvironmentProduction;
    }
    else if([envName isEqualToString:@"development"]) {
        environment = EnvironmentDevelopment;
    } else {
        environment = EnvironmentStaging;
    }

    GatewayConfig *config = [[GatewayConfig alloc]
                             initWithGatewayName:gateway
                             brokerConfig:preProvidedBrokers
                             apiEnvironment:environment
                             isLeprechaunActive:isLeprechaunActive
                             isAmoEnabled:isAmoEnabled];

    [SCGateway.shared setupWithConfig: config completion:^(BOOL success,NSError * error)
     {
        if(success)
        {
            resolve(@(YES));
        } else {
            NSMutableDictionary *responseDict = [[NSMutableDictionary alloc] init];
            [responseDict setValue:[NSNumber numberWithInteger:error.code]  forKey:@"errorCode"];
            [responseDict setValue:error.domain  forKey:@"errorMessage"];

            NSError *err = [[NSError alloc] initWithDomain:error.domain code:error.code userInfo:responseDict];

            reject(@"setConfigEnvironment", @"Env setup failed", err);
        }
    }];
}

RCT_REMAP_METHOD(init,
                 sdkToken:(NSString *)sdkToken
                 initWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    [SCGateway.shared initializeGatewayWithSdkToken:sdkToken completion:^(BOOL success, NSError * error) {
        if(success){
            resolve(@(YES));
        } else {
            if(error != nil)
            {
                NSMutableDictionary *responseDict = [[NSMutableDictionary alloc] init];
                [responseDict setValue:[NSNumber numberWithInteger:error.code]  forKey:@"errorCode"];
                [responseDict setValue:error.domain  forKey:@"errorMessage"];

                NSError *err = [[NSError alloc] initWithDomain:error.domain code:error.code userInfo:responseDict];

                reject(@"init", @"Error during init", err);
                return;
            }
            reject(@"init", @"Error during init", error);
        }
    }];
}

RCT_REMAP_METHOD(triggerTransaction,
                 transactionId:(NSString *)transactionId
                 utmParams:(NSDictionary *)utmParams
                 brokerList:(NSArray *)brokerList
                 triggerTransactionWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^(void) {
        [SCGateway.shared
         triggerTransactionFlowWithTransactionId:transactionId
         presentingController:[[[UIApplication sharedApplication] keyWindow] rootViewController]
         utmParams:utmParams
         brokerConfig:brokerList
         completion: ^(id response, NSError * error) {
            if (error != nil) {
                NSMutableDictionary *responseDict = [[NSMutableDictionary alloc] init];
                [responseDict setValue:[NSNumber numberWithInteger:error.code]  forKey:@"errorCode"];
                [responseDict setValue:error.domain  forKey:@"errorMessage"];

                NSError *err = [[NSError alloc] initWithDomain:error.domain code:error.code userInfo:responseDict];

                reject(@"triggerTransaction", @"Error during transaction", err);
                return;
            }

            NSMutableDictionary *responseDict =  [[NSMutableDictionary alloc] init];
            [responseDict setValue:[NSNumber numberWithBool:true] forKey:@"success"];

            // intent - transaction
            if ([response isKindOfClass: [ObjcTransactionIntentTransaction class]]) {
                ObjcTransactionIntentTransaction *trxResponse = response;
                [responseDict setObject:@"TRANSACTION"  forKey:@"transaction"];

                NSData *decodedStringData = [[NSData alloc] initWithBase64EncodedString:trxResponse.transaction options: 0];
                NSString *decodedResponse = [[NSString alloc] initWithData:decodedStringData encoding:1];

                [responseDict setObject:decodedResponse forKey:@"data"];
                resolve(responseDict);
                return;
            }

            // intent - connect
            if([response isKindOfClass: [ObjCTransactionIntentConnect class]]) {
                ObjCTransactionIntentConnect *trxResponse = response;
                [responseDict setValue:@"CONNECT"  forKey:@"transaction"];

                if (trxResponse.response != nil) {
                    [responseDict setValue:trxResponse.response forKey:@"data"];
                }
                
                resolve(responseDict);
                return;
            }

            // intent - holdings import
            if([response isKindOfClass: [ObjcTransactionIntentHoldingsImport class]]) {
                ObjcTransactionIntentHoldingsImport *trxResponse = response;
                [responseDict setValue:@"HOLDING_IMPORT"  forKey:@"transaction"];

                NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
                [dict setValue: trxResponse.authToken  forKey:@"smallcaseAuthToken"];
                [dict setValue: trxResponse.transactionId forKey:@"transactionId"];
                [dict setValue: trxResponse.broker forKey:@"broker"];

                [responseDict setValue:dict forKey:@"data"];
                resolve(responseDict);
                return;
            }

            // intent - fetch funds
            if([response isKindOfClass: [ObjcTransactionIntentFetchFunds class]]) {
                ObjcTransactionIntentFetchFunds *trxResponse = response;
                [responseDict setValue:@"FETCH_FUNDS"  forKey:@"transaction"];

                NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
                [dict setValue: trxResponse.authToken  forKey:@"smallcaseAuthToken"];
                [dict setValue: trxResponse.transactionId forKey:@"transactionId"];

                [dict setValue:[NSNumber numberWithDouble:trxResponse.fund] forKey:@"fund"];

                [responseDict setValue:dict forKey:@"data"];
                resolve(responseDict);
                return;
            }

            // intent - sip setup
            if([response isKindOfClass: [ObjcTransactionIntentSipSetup class]]) {
                ObjcTransactionIntentSipSetup *trxResponse = response;
                [responseDict setValue:@"SIP_SETUP"  forKey:@"transaction"];

                NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
                [dict setValue: trxResponse.authToken  forKey:@"smallcaseAuthToken"];
                [dict setValue: trxResponse.transactionId forKey:@"transactionId"];
                [dict setValue: trxResponse.sipAction forKey:@"sipAction"];
                [dict setValue: trxResponse.sipType forKey:@"sipType"];
                [dict setValue: trxResponse.frequency forKey:@"frequency"];
                [dict setValue: trxResponse.iscid forKey:@"iscid"];
                [dict setValue: trxResponse.scheduledDate forKey:@"scheduledDate"];
                [dict setValue: trxResponse.scid forKey:@"scid"];
                [dict setValue: trxResponse.sipActive ? @"YES" : @"NO" forKey:@"sipActive"];
                [dict setValue: [NSNumber numberWithDouble: trxResponse.sipAmount] forKey:@"sipAmount"];

                [responseDict setValue:dict forKey:@"data"];
                resolve(responseDict);
                return;
            }


            // intent - authorize holdings
            if([response isKindOfClass: [ObjcTransactionIntentAuthoriseHoldings class]]) {
                ObjcTransactionIntentAuthoriseHoldings *trxResponse = response;
                [responseDict setValue:@"AUTHORISE_HOLDINGS"  forKey:@"transaction"];

                NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
                [dict setValue: trxResponse.authToken  forKey:@"smallcaseAuthToken"];
                [dict setValue: trxResponse.transactionId forKey:@"transactionId"];

                [dict setValue: [NSNumber numberWithBool:trxResponse.status] forKey:@"status"];

                [responseDict setValue:dict forKey:@"data"];
                resolve(responseDict);
                return;
            }

            // no matching intent type
            NSError *err = [[NSError alloc] initWithDomain:@"com.smallcase.gateway" code:0 userInfo:@{@"Error reason": @"no matching response type"}];
            reject(@"triggerTransaction", @"no matching response type", err);
        }];
    });
}

RCT_REMAP_METHOD(showOrders,
                 showOrdersWithResolver: (RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^(void) {
        
        NSMutableDictionary *responseDict = [[NSMutableDictionary alloc] init];
        
        [SCGateway.shared
         showOrdersWithPresentingController:[[[UIApplication sharedApplication] keyWindow] rootViewController]
         completion:^(BOOL success, NSError * error) {
         
            if(success){
                resolve(@(YES));
            } else {
                [responseDict setValue:[NSNumber numberWithInteger:error.code]  forKey:@"errorCode"];
                [responseDict setValue:error.domain  forKey:@"error"];
                resolve(responseDict);
            }
        }];
    });
}

RCT_REMAP_METHOD(launchSmallplug,
                  targetEndpoint:(NSString *)targetEndpoint
                  params:(NSString *)params
                  launchSmallplugWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^(void) {
       
        SmallplugData *smallplugData = [[SmallplugData alloc] init:targetEndpoint :params];
        
        [SCGateway.shared launchSmallPlugWithPresentingController:[[[UIApplication sharedApplication] keyWindow] rootViewController] smallplugData:smallplugData completion:^(id smallplugResponse, NSError * error) {
            
            NSMutableDictionary *responseDict = [[NSMutableDictionary alloc] init];
            
            if (error != nil) {
                NSLog(@"%@", error.domain);
                double delayInSeconds = 0.5;
                dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delayInSeconds * NSEC_PER_SEC));
                dispatch_after(popTime, dispatch_get_main_queue(), ^(void) {
                    NSMutableDictionary *responseDict = [[NSMutableDictionary alloc] init];
                    [responseDict setValue:[NSNumber numberWithBool:false] forKey:@"success"];
                    [responseDict setValue:[NSNumber numberWithInteger:error.code]  forKey:@"errorCode"];
                    [responseDict setValue:error.domain  forKey:@"error"];
                    
                    resolve(responseDict);
                    return;
                });
            } else {
                
                if ([smallplugResponse isKindOfClass: [NSString class]]) {
                    NSLog(@"%@", smallplugResponse);
                    
                    [responseDict setValue:[NSNumber numberWithBool: true] forKey:@"success"];
                    [responseDict setValue:smallplugResponse forKey:@"smallcaseAuthToken"];
                    
                    double delayInSeconds = 0.5;
                    dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delayInSeconds * NSEC_PER_SEC));
                    dispatch_after(popTime, dispatch_get_main_queue(), ^(void) {
                    
                        resolve(responseDict);
                        return;
                        
                    });
                }
            }
            
        }];
    });
}

RCT_REMAP_METHOD(archiveSmallcase,
                 iscid:(NSString *)iscid
                 initWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    [SCGateway.shared markSmallcaseArchiveWithIscid:iscid completion: ^(id response, NSError * error) {
        if(error != nil) {
            NSMutableDictionary *responseDict = [[NSMutableDictionary alloc] init];
            [responseDict setValue:[NSNumber numberWithInteger:error.code]  forKey:@"errorCode"];
            [responseDict setValue:error.domain  forKey:@"errorMessage"];
            
            NSError *err = [[NSError alloc] initWithDomain:error.domain code:error.code userInfo:responseDict];
            
            reject(@"archiveSmallcase", @"Error during transaction", err);
            return;
        }
        
        NSString *archiveResponseString = [[NSString alloc] initWithData:response encoding:NSUTF8StringEncoding];
        
        NSMutableDictionary *responseDict =  [[NSMutableDictionary alloc] init];
        [responseDict setValue:[NSNumber numberWithBool:true] forKey:@"success"];
        
        [responseDict setObject:archiveResponseString forKey:@"data"];
        resolve(responseDict);
        return;
    }];
}

RCT_REMAP_METHOD(triggerLeadGenWithStatus,
                 userParams: (NSDictionary *)userParams
                 leadGenGenWithResolver: (RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^(void) {
        
        [SCGateway.shared triggerLeadGenWithPresentingController:[[[UIApplication sharedApplication] keyWindow] rootViewController] params:userParams
                                                      completion:^(NSString * leadGenResponse) {
            resolve(leadGenResponse);
        }
        ];
        
    });
}

RCT_EXPORT_METHOD(triggerLeadGen: (NSDictionary *)userParams utmParams:(NSDictionary *)utmParams)
{
    dispatch_async(dispatch_get_main_queue(), ^(void) {
        [SCGateway.shared triggerLeadGenWithPresentingController:[[[UIApplication sharedApplication] keyWindow] rootViewController] params:userParams utmParams: utmParams];
    });
}

RCT_REMAP_METHOD(logoutUser,
                 logoutUserWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^(void) {
        [SCGateway.shared
            logoutUserWithPresentingController:[[[UIApplication sharedApplication] keyWindow] rootViewController]
            completion:^(BOOL success, NSError * error) {
                if(success){
                    resolve(@(YES));
                } else {
                    reject(@"logout", @"Error during logout", error);
                }
        }];
    });
}

@end





