#import "SmallcaseGateway.h"

#import <SCGateway/SCGateway.h>
#import <SCGateway/SCGateway-Swift.h>


@implementation SmallcaseGateway

RCT_EXPORT_MODULE()

RCT_REMAP_METHOD(setConfigEnvironment,
                 envName:(NSString *)envName
                 gateway:(NSString *)gateway
                 isLeprechaunActive: (BOOL *)isLeprechaunActive
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
                             isLeprechaunActive: isLeprechaunActive];
    
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
            }
            reject(@"init", @"Error during init", error);
        }
    }];
    
    
}

RCT_REMAP_METHOD(triggerTransaction,
                 transactionId:(NSString *)transactionId
                 triggerTransactionWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^(void) {
        [SCGateway.shared triggerTransactionFlowWithTransactionId: transactionId presentingController:[[[UIApplication sharedApplication] keyWindow] rootViewController] completion:^(id response, NSError * error) {
            
            if (error != nil) {
                NSMutableDictionary *responseDict = [[NSMutableDictionary alloc] init];
                [responseDict setValue:[NSNumber numberWithInteger:error.code]  forKey:@"errorCode"];
                [responseDict setValue:error.domain  forKey:@"errorMessage"];
                
                NSError *err = [[NSError alloc] initWithDomain:error.domain code:error.code userInfo:responseDict];
                
                reject(@"init", @"Error during init", err);
                return;
            }
            
            NSMutableDictionary *responseDict =  [[NSMutableDictionary alloc] init];
            [responseDict setValue:[NSNumber numberWithBool:true] forKey:@"success"];
            
            if ([response isKindOfClass: [ObjcTransactionIntentTransaction class]]) {
                ObjcTransactionIntentTransaction *trxResponse = response;
                NSData *decodedStringData = [[NSData alloc] initWithBase64EncodedString:trxResponse.transaction options: 0];
                
                NSString *decodedResponse = [[NSString alloc] initWithData:decodedStringData encoding:1];
                NSMutableDictionary *dict=[NSJSONSerialization JSONObjectWithData:[decodedResponse dataUsingEncoding:NSUTF8StringEncoding] options:kNilOptions error:nil];
                
                [responseDict setObject:dict forKey:@"data"];
                [responseDict setObject:@"TRANSACTION"  forKey:@"transaction"];
                resolve(responseDict);
                return;
            }
            
            if([response isKindOfClass: [ObjCTransactionIntentConnect class]]) {
                ObjCTransactionIntentConnect *trxResponse = response;
                [responseDict setValue:@"CONNECT"  forKey:@"transaction"];
                
                if (trxResponse.authToken != nil)
                {
                    [responseDict setValue:trxResponse.authToken forKey:@"data"];
                }
                resolve(responseDict);
                return;
            }
            
            if([response isKindOfClass: [ObjcTransactionIntentHoldingsImport class]]) {
                ObjcTransactionIntentHoldingsImport *trxResponse = response;
                
                NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
                [dict setValue: trxResponse.authToken  forKey:@"smallcaseAuthToken"];
                [dict setValue: trxResponse.transactionId forKey:@"transactionId"];
                
                [responseDict setValue:@"HOLDING_IMPORT"  forKey:@"transaction"];
                [responseDict setValue:dict forKey:@"data"];
                resolve(responseDict);
            }
            
        }];
    });
}

RCT_EXPORT_METHOD(triggerLeadGen: (NSDictionary *)params)
{
    dispatch_async(dispatch_get_main_queue(), ^(void) {
        [SCGateway.shared triggerLeadGenWithPresentingController:[[[UIApplication sharedApplication] keyWindow] rootViewController] params:params];
    });
}
@end
