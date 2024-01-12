#import <React/RCTBridgeModule.h>

#import <SCGateway/SCGateway.h>
#import <SCGateway/SCGateway-Swift.h>
#import <Loans/Loans.h>

//#import <SmallcaseGateway/SmallcaseGateway-Swift.h>

@interface RCT_EXTERN_MODULE(SmallcaseGateway, NSObject)
RCT_EXTERN_METHOD(
                  signInWith: (NSString) provider resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject
                  )
@end