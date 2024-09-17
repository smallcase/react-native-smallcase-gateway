#import <React/RCTBridgeModule.h>
#import <SCGateway/SCGateway.h>
#import <SCGateway/SCGateway-Swift.h>
#import <Loans/Loans.h>

@interface RCT_EXTERN_MODULE(SmallcaseGateway, NSObject)

// SDK Version
RCT_EXTERN_METHOD(setHybridSdkVersion:(NSString *)sdkVersion)

RCT_EXTERN_METHOD(getSdkVersion:(NSString *)reactNativeSdkVersion
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// SDK Setup
RCT_EXTERN_METHOD(setConfigEnvironment:(NSString *)envName
                  gateway:(NSString *)gateway
                  isLeprechaunActive:(nonnull NSNumber *)isLeprechaunActive
                  isAmoEnabled:(nonnull NSNumber *)isAmoEnabled
                  preProvidedBrokers:(NSArray *)preProvidedBrokers
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// SDK Init
RCT_EXTERN_METHOD(initSDK:(NSString *)sdkToken
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)


// Trigger Mutual Fund Transaction
RCT_EXTERN_METHOD(triggerMfTransaction:(NSString *)transactionId
                  triggerTransactionWithResolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Trigger Transaction
RCT_EXTERN_METHOD(triggerTransaction:(NSString *)transactionId
                  utmParams:(NSDictionary *)utmParams
                  brokerList:(NSArray *)brokerList
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Show Orders
RCT_EXTERN_METHOD(showOrders:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Launch Smallplug
RCT_EXTERN_METHOD(launchSmallplug:(NSString *)targetEndpoint
                  params:(NSString *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Launch Smallplug with Branding
RCT_EXTERN_METHOD(launchSmallplugWithBranding:(NSString *)targetEndpoint
                  params:(NSString *)params
                  headerColor:(NSString *)headerColor
                  headerOpacity:(nonnull NSNumber *)headerOpacity
                  backIconColor:(NSString *)backIconColor
                  backIconOpacity:(nonnull NSNumber *)backIconOpacity
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Archive Smallcase
RCT_EXTERN_METHOD(archiveSmallcase:(NSString *)iscid
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Trigger Lead Generation
RCT_EXTERN_METHOD(triggerLeadGenWithStatus:(NSDictionary *)userParams
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(triggerLeadGen:(NSDictionary *)userParams
                  utmParams:(NSDictionary *)utmParams)

RCT_EXTERN_METHOD(triggerLeadGenWithLoginCta:(NSDictionary *)userParams
                  utmParams:(NSDictionary *)utmParams
                  showLoginCta:(BOOL)showLoginCta
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// User Logout
RCT_EXTERN_METHOD(logoutUser:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Loans Setup
RCT_EXTERN_METHOD(setupLoans:(NSDictionary *)loanConfig
                  withResolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Apply for Loan
RCT_EXTERN_METHOD(apply:(NSDictionary *)loanInfo
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Pay Loan
RCT_EXTERN_METHOD(pay:(NSDictionary *)loanInfo
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Withdraw Loan
RCT_EXTERN_METHOD(withdraw:(NSDictionary *)loanInfo
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Service Loan
RCT_EXTERN_METHOD(service:(NSDictionary *)loanInfo
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Trigger Interaction
RCT_EXTERN_METHOD(triggerInteraction:(NSDictionary *)loanInfo
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end

