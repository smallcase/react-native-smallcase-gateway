import { NativeModules, Platform, NativeEventEmitter } from 'react-native';
import { ENV } from './constants';
import { safeObject, platformSpecificColorHex } from './util';
import { version } from '../package.json';
const { SmallcaseGateway: SmallcaseGatewayNative } = NativeModules;
/**
 *
 * @typedef {Object} envConfig
 * @property {string}        gatewayName     - unique name on consumer
 * @property {boolean}       isLeprechaun    - leprechaun mode toggle
 * @property {boolean}       isAmoEnabled    - support AMO (subject to broker support)
 * @property {Array<string>} brokerList      - list of broker names
 * @property {'production' | 'staging' | 'development'}  environmentName - environment name
 *
 * @typedef {Object} transactionRes
 * @property {string}   data        - response data
 * @property {boolean}  success     - success flag
 * @property {Number}   [errorCode] - error code
 * @property {string}   transaction - transaction name
 *
 * @typedef {Object} userDetails
 * @property {String} name - name of user
 * @property {String} email - email of user
 * @property {String} contact - contact of user
 * @property {String} pinCode - pin-code of user
 *
 * @typedef {Object} SmallplugUiConfig
 * @property {String} headerColor - color of the header background
 * @property {Number} headerOpacity - opacity of the header background
 * @property {String} backIconColor - color of the back icon
 * @property {Number} backIconOpacity - opacity of the back icon
 *
 */
let defaultBrokerList = [];
/**
 * configure the sdk with
 * @param {envConfig} envConfig
 */
const setConfigEnvironment = async (envConfig) => {
  const safeConfig = safeObject(envConfig);
  await SmallcaseGatewayNative.setHybridSdkVersion(version);
  const {
    brokerList,
    gatewayName,
    isLeprechaun,
    isAmoEnabled,
    environmentName,
  } = safeConfig;
  const safeIsLeprechaun = Boolean(isLeprechaun);
  const safeIsAmoEnabled = Boolean(isAmoEnabled);
  const safeBrokerList = Array.isArray(brokerList) ? brokerList : [];
  const safeGatewayName = typeof gatewayName === 'string' ? gatewayName : '';
  const safeEnvName =
    typeof environmentName === 'string' ? environmentName : ENV.PROD;
  defaultBrokerList = safeBrokerList;
  await SmallcaseGatewayNative.setConfigEnvironment(
    safeEnvName,
    safeGatewayName,
    safeIsLeprechaun,
    safeIsAmoEnabled,
    safeBrokerList
  );
};
const analyticsEventEmitter =
  Platform.OS === 'ios' ? new NativeEventEmitter(SmallcaseGatewayNative) : null;
let _analyticsListener = null;
/**
 * initialize sdk with a session
 *
 * note: this must be called after `setConfigEnvironment()`
 * @param {string} sdkToken
 */
const init = async (sdkToken) => {
  const safeToken = typeof sdkToken === 'string' ? sdkToken : '';
  return SmallcaseGatewayNative.init(safeToken);
};
/**
 * triggers a transaction with a transaction id
 *
 * @param {string} transactionId
 * @param {Object} [utmParams]
 * @param {Array<string>} [brokerList]
 * @returns {Promise<transactionRes>}
 */
const triggerTransaction = async (transactionId, utmParams, brokerList) => {
  const safeUtm = safeObject(utmParams);
  const safeId = typeof transactionId === 'string' ? transactionId : '';
  const safeBrokerList =
    Array.isArray(brokerList) && brokerList.length
      ? brokerList
      : defaultBrokerList;
  return SmallcaseGatewayNative.triggerTransaction(
    safeId,
    safeUtm,
    safeBrokerList
  );
};
/**
 * triggers a transaction with a transaction id
 * @deprecated triggerMfTransaction will be removed soon. Please use triggerTransaction.
 * @param {string} transactionId
 * @returns {Promise<transactionRes>}
 */
const triggerMfTransaction = async (transactionId) => {
  console.warn(
    'Calling deprecated function! triggerMfTransaction will be removed soon. Please use triggerTransaction.'
  );
  const safeTransactionId =
    typeof transactionId === 'string' ? transactionId : '';
  return SmallcaseGatewayNative.triggerMfTransaction(safeTransactionId);
};
/**
 * launches smallcases module
 *
 * @param {string} targetEndpoint
 * @param {string} params
 */
const launchSmallplug = async (targetEndpoint, params) => {
  const safeEndpoint = typeof targetEndpoint === 'string' ? targetEndpoint : '';
  const safeParams = typeof params === 'string' ? params : '';
  return SmallcaseGatewayNative.launchSmallplug(safeEndpoint, safeParams);
};
/**
 * launches smallcases module
 *
 * @param {string} targetEndpoint
 * @param {string} params
 * @param {string} headerColor
 * @param {number} headerOpacity
 * @param {string} backIconColor
 * @param {number} backIconOpacity
 */
const launchSmallplugWithBranding = async (
  targetEndpoint,
  params,
  headerColor,
  headerOpacity,
  backIconColor,
  backIconOpacity
) => {
  const safeEndpoint = typeof targetEndpoint === 'string' ? targetEndpoint : '';
  const safeParams = typeof params === 'string' ? params : '';
  const safeHeaderColor =
    typeof headerColor === 'string'
      ? headerColor
      : platformSpecificColorHex('2F363F');
  const safeHeaderOpacity =
    typeof headerOpacity === 'number' ? headerOpacity : 1;
  const safeBackIconColor =
    typeof backIconColor === 'string'
      ? backIconColor
      : platformSpecificColorHex('FFFFFF');
  const safeBackIconOpacity =
    typeof backIconOpacity === 'number' ? backIconOpacity : 1;
  return Platform.OS === 'android'
    ? SmallcaseGatewayNative.launchSmallplugWithBranding(
        safeEndpoint,
        safeParams,
        {
          headerColor: safeHeaderColor,
          headerOpacity: safeHeaderOpacity,
          backIconColor: safeBackIconColor,
          backIconOpacity: safeBackIconOpacity,
        }
      )
    : SmallcaseGatewayNative.launchSmallplugWithBranding(
        safeEndpoint,
        safeParams,
        safeHeaderColor,
        safeHeaderOpacity,
        safeBackIconColor,
        safeBackIconOpacity
      );
};
/**
 * Logs the user out and removes the web session.
 *
 * This promise will be rejected if logout was unsuccessful
 *
 * @returns {Promise}
 */
const logoutUser = async () => {
  return SmallcaseGatewayNative.logoutUser();
};
/**
 * This will display a list of all the orders that a user recently placed.
 * This includes pending, successful, and failed orders.
 * @returns
 */
const showOrders = async () => {
  return SmallcaseGatewayNative.showOrders();
};
/**
 * triggers the lead gen flow
 *
 * @param {userDetails} [userDetails]
 * @param {Object} [utmParams]
 */
const triggerLeadGen = (userDetails, utmParams) => {
  const safeParams = safeObject(userDetails);
  const safeUtm = safeObject(utmParams);
  return SmallcaseGatewayNative.triggerLeadGen(safeParams, safeUtm);
};
/**
 * triggers the lead gen flow
 *
 * @param {userDetails} [userDetails]
 * * @returns {Promise}
 */
const triggerLeadGenWithStatus = async (userDetails) => {
  const safeParams = safeObject(userDetails);
  return SmallcaseGatewayNative.triggerLeadGenWithStatus(safeParams);
};
/**
 * triggers the lead gen flow with an option of "login here" cta
 *
 * @param {userDetails} [userDetails]
 * @param {Object} [utmParams]
 * @param {boolean} [showLoginCta]
 * @returns {Promise}
 */
const triggerLeadGenWithLoginCta = async (
  userDetails,
  utmParams,
  showLoginCta
) => {
  const safeParams = safeObject(userDetails);
  const safeUtm = safeObject(utmParams);
  const safeShowLoginCta = Boolean(showLoginCta);
  return SmallcaseGatewayNative.triggerLeadGenWithLoginCta(
    safeParams,
    safeUtm,
    safeShowLoginCta
  );
};
/**
 * Marks a smallcase as archived
 *
 * @param {String} iscid
 */
const archiveSmallcase = async (iscid) => {
  const safeIscid = typeof iscid === 'string' ? iscid : '';
  return SmallcaseGatewayNative.archiveSmallcase(safeIscid);
};
/**
 * Returns the native android/ios and react-native sdk version
 * (internal-tracking)
 * @returns {Promise}
 */
const getSdkVersion = async () => {
  return SmallcaseGatewayNative.getSdkVersion(version);
};
/**
 * Start listening to analytics notifications from the native framework
 *
 * @param {function} callback - Function to handle analytics notifications
 * @returns {Promise<boolean>}
 */
const startAnalyticsListener = async (callback) => {
  if (_analyticsListener) {
    console.warn('SmallcaseGateway: Analytics listener already active');
    return false;
  }
  if (typeof callback !== 'function') {
    throw new Error('SmallcaseGateway: Callback must be a function');
  }
  try {
    if (Platform.OS === 'ios') {
      // Start the native observer
      await SmallcaseGatewayNative.startAnalyticsListener();
      // Listen to analytics notifications
      _analyticsListener = analyticsEventEmitter.addListener(
        'scg_notification',
        callback
      );
      return true;
    } else {
      // Android implementation when ready
      console.warn(
        'SmallcaseGateway: Analytics listener not yet supported on Android'
      );
      return false;
    }
  } catch (error) {
    console.error(
      'SmallcaseGateway: Failed to start analytics listener',
      error
    );
    throw error;
  }
};
/**
 * Stop listening to analytics notifications
 *
 * @returns {Promise<boolean>}
 */
const stopAnalyticsListener = async () => {
  if (!_analyticsListener) {
    return false;
  }
  try {
    // Remove the event listener
    _analyticsListener.remove();
    _analyticsListener = null;
    if (Platform.OS === 'ios') {
      // Stop the native observer
      await SmallcaseGatewayNative.stopAnalyticsListener();
    }
    return true;
  } catch (error) {
    console.error('SmallcaseGateway: Failed to stop analytics listener', error);
    throw error;
  }
};
const SmallcaseGateway = {
  init,
  logoutUser,
  triggerLeadGen,
  triggerLeadGenWithStatus,
  triggerLeadGenWithLoginCta,
  archiveSmallcase,
  triggerTransaction,
  triggerMfTransaction,
  setConfigEnvironment,
  launchSmallplug,
  launchSmallplugWithBranding,
  getSdkVersion,
  showOrders,
  startAnalyticsListener,
  stopAnalyticsListener,
};
export default SmallcaseGateway;
5:46
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <SCGateway/SCGateway.h>
#import <SCGateway/SCGateway-Swift.h>
#import <Loans/Loans.h>
@interface RCT_EXTERN_MODULE(SmallcaseGateway, RCTEventEmitter)
//MARK: SDK version helpers
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
//MARK: SDK setup
RCT_REMAP_METHOD(setConfigEnvironment,
                 envName:(NSString *)envName
                 gateway:(NSString *)gateway
                 isLeprechaunActive: (BOOL *)isLeprechaunActive
                 isAmoEnabled: (BOOL *)isAmoEnabled
                 preProvidedBrokers: (NSArray *)preProvidedBrokers
                 setConfigEnvironmentWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
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
    [SCGateway.shared setupWithConfig: config completion:^(BOOL success,NSError * error) {
        if(success) {
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
//MARK: SDK init
RCT_REMAP_METHOD(init,
                 sdkToken:(NSString *)sdkToken
                 initWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
    [SCGateway.shared initializeGatewayWithSdkToken:sdkToken completion:^(BOOL success, NSError * error) {
        if(success) {
            resolve(@(YES));
        } else {
            if(error != nil) {
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
//MARK: Trigger Mf Transaction
RCT_REMAP_METHOD(triggerMfTransaction,
                 transactionId:(NSString *)transactionId
                 triggerTransactionWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
dispatch_async(dispatch_get_main_queue(), ^(void) {
    [SCGateway.shared
         triggerMfTransactionWithPresentingController:
         [[[UIApplication sharedApplication] keyWindow] rootViewController]
         transactionId: transactionId
         completion: ^(id response, NSError * error) {
            if (error != nil) {
                NSMutableDictionary *responseDict = [[NSMutableDictionary alloc] init];
                [responseDict setValue:[NSNumber numberWithInteger:error.code]  forKey:@"errorCode"];
                [responseDict setValue:error.domain  forKey:@"errorMessage"];
                [responseDict setValue:[error.userInfo objectForKey: @"data"] forKey:@"data"];
                NSError *err = [[NSError alloc] initWithDomain:error.domain code:error.code userInfo:responseDict];
                reject(@"triggerTransaction", @"Error during transaction", err);
                return;
            }
            //MARK: intent - mf transaction
            if ([response isKindOfClass: [ObjCTransactionIntentMfHoldingsImport class]]) {
                NSMutableDictionary *responseDict = [[NSMutableDictionary alloc] init];
                ObjCTransactionIntentMfHoldingsImport *trxResponse = response;
                [responseDict setObject:@"TRANSACTION"  forKey:@"transaction"];
                NSData *decodedStringData = [[NSData alloc] initWithBase64EncodedString:trxResponse.data options: 0];
                NSString *decodedResponse = [[NSString alloc] initWithData:decodedStringData encoding:1];
                [responseDict setObject:trxResponse.data forKey:@"data"];
                resolve(responseDict);
                return;
            }
            // no matching intent type
            NSError *err = [[NSError alloc] initWithDomain:@"com.smallcase.gateway" code:0 userInfo:@{@"Error reason": @"no matching response type"}];
            reject(@"triggerMfTransaction", @"no matching response type", err);
         }];
});
                 }
//MARK: Trigger Transaction
RCT_REMAP_METHOD(triggerTransaction,
                 transactionId:(NSString *)transactionId
                 utmParams:(NSDictionary *)utmParams
                 brokerList:(NSArray *)brokerList
                 triggerTransactionWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
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
                [responseDict setValue:[error.userInfo objectForKey: @"data"] forKey:@"data"];
                NSError *err = [[NSError alloc] initWithDomain:error.domain code:error.code userInfo:responseDict];
                reject(@"triggerTransaction", @"Error during transaction", err);
                return;
            }
            NSMutableDictionary *responseDict =  [[NSMutableDictionary alloc] init];
            [responseDict setValue:[NSNumber numberWithBool:true] forKey:@"success"];
            //MARK: intent - transaction
            if ([response isKindOfClass: [ObjcTransactionIntentTransaction class]]) {
                ObjcTransactionIntentTransaction *trxResponse = response;
                [responseDict setObject:@"TRANSACTION"  forKey:@"transaction"];
                NSData *decodedStringData = [[NSData alloc] initWithBase64EncodedString:trxResponse.transaction options: 0];
                NSString *decodedResponse = [[NSString alloc] initWithData:decodedStringData encoding:1];
                [responseDict setObject:decodedResponse forKey:@"data"];
                resolve(responseDict);
                return;
            }
             //MARK: intent - mfTransaction
             if ([response isKindOfClass: [ObjcMfTransactionIntentTransaction class]]) {
                NSMutableDictionary *responseDict = [[NSMutableDictionary alloc] init];
                ObjcMfTransactionIntentTransaction *trxResponse = response;
                [responseDict setObject:@"TRANSACTION"  forKey:@"transaction"];
                [responseDict setObject:trxResponse.data forKey:@"data"];
                resolve(responseDict);
                return;
            }
            //MARK: intent - connect
            if([response isKindOfClass: [ObjCTransactionIntentConnect class]]) {
                ObjCTransactionIntentConnect *trxResponse = response;
                [responseDict setValue:@"CONNECT"  forKey:@"transaction"];
                if (trxResponse.response != nil) {
                    [responseDict setValue:trxResponse.response forKey:@"data"];
                }
                resolve(responseDict);
                return;
            }
            //MARK: intent - connect
            if([response isKindOfClass: [ObjCTransactionIntentOnboarding class]]) {
                ObjCTransactionIntentOnboarding *trxResponse = response;
                [responseDict setValue:@"ONBOARDING"  forKey:@"transaction"];
                if (trxResponse.response != nil) {
                    [responseDict setValue:trxResponse.response forKey:@"data"];
                }
                resolve(responseDict);
                return;
            }
            //MARK: intent - holdings import
            if([response isKindOfClass: [ObjcTransactionIntentHoldingsImport class]]) {
                ObjcTransactionIntentHoldingsImport *trxResponse = response;
                [responseDict setValue:@"HOLDING_IMPORT"  forKey:@"transaction"];
                NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
                [dict setValue: trxResponse.authToken  forKey:@"smallcaseAuthToken"];
                [dict setValue: trxResponse.transactionId forKey:@"transactionId"];
                [dict setValue: trxResponse.broker forKey:@"broker"];
                [dict setValue: trxResponse.signup forKey:@"signup"];
                [responseDict setValue:dict forKey:@"data"];
                resolve(responseDict);
                return;
            }
            //MARK: intent - fetch funds
            if([response isKindOfClass: [ObjcTransactionIntentFetchFunds class]]) {
                ObjcTransactionIntentFetchFunds *trxResponse = response;
                [responseDict setValue:@"FETCH_FUNDS"  forKey:@"transaction"];
                NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
                [dict setValue: trxResponse.authToken  forKey:@"smallcaseAuthToken"];
                [dict setValue: trxResponse.transactionId forKey:@"transactionId"];
                [dict setValue: trxResponse.signup forKey:@"signup"];
                [dict setValue:[NSNumber numberWithDouble:trxResponse.fund] forKey:@"fund"];
                [responseDict setValue:dict forKey:@"data"];
                resolve(responseDict);
                return;
            }
            //MARK: intent - sip setup
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
                [dict setValue: trxResponse.signup forKey:@"signup"];
                [responseDict setValue:dict forKey:@"data"];
                resolve(responseDict);
                return;
            }
            //MARK: intent - authorize holdings
            if([response isKindOfClass: [ObjcTransactionIntentAuthoriseHoldings class]]) {
                ObjcTransactionIntentAuthoriseHoldings *trxResponse = response;
                [responseDict setValue:@"AUTHORISE_HOLDINGS"  forKey:@"transaction"];
                NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
                [dict setValue: trxResponse.authToken  forKey:@"smallcaseAuthToken"];
                [dict setValue: trxResponse.transactionId forKey:@"transactionId"];
                [dict setValue: trxResponse.signup forKey:@"signup"];
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
//MARK: Show orders
RCT_REMAP_METHOD(showOrders,
                 showOrdersWithResolver: (RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
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
                [responseDict setValue:[error.userInfo objectForKey: @"data"] forKey:@"data"];
                resolve(responseDict);
            }
        }];
    });
}
//MARK: smallplug
RCT_REMAP_METHOD(launchSmallplug,
                  targetEndpoint:(NSString *)targetEndpoint
                  params:(NSString *)params
                  launchSmallplugWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
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
//MARK: smallplug with branding
RCT_REMAP_METHOD(launchSmallplugWithBranding,
                 targetEndpoint:(NSString *)targetEndpoint
                 params:(NSString *)params
                 headerColor:(NSString *)headerColor
                 headerOpacity:(nonnull NSNumber *)headerOpacity
                 backIconColor:(NSString *)backIconColor
                 backIconOpacity:(nonnull NSNumber *)backIconOpacity
                 launchSmallplugWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^(void) {
        SmallplugData *smallplugData = [[SmallplugData alloc] init:targetEndpoint :params];
        SmallplugUiConfig *smallplugUiConfig = [[SmallplugUiConfig alloc] initWithSmallplugHeaderColor:headerColor headerColorOpacity:headerOpacity backIconColor:backIconColor backIconColorOpacity:backIconOpacity];
        [SCGateway.shared launchSmallPlugWithPresentingController:[[[UIApplication sharedApplication] keyWindow] rootViewController] smallplugData:smallplugData smallplugUiConfig:smallplugUiConfig completion:^(id smallplugResponse, NSError * error) {
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
//MARK: Archive smallcase
RCT_REMAP_METHOD(archiveSmallcase,
                 iscid:(NSString *)iscid
                 initWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
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
//MARK: Lead Gen
RCT_REMAP_METHOD(triggerLeadGenWithStatus,
                 userParams: (NSDictionary *)userParams
                 leadGenGenWithResolver: (RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^(void) {
        [SCGateway.shared triggerLeadGenWithPresentingController:[[[UIApplication sharedApplication] keyWindow] rootViewController] params:userParams
                                                      completion:^(NSString * leadGenResponse) {
            resolve(leadGenResponse);
        }
        ];
    });
}
RCT_EXPORT_METHOD(triggerLeadGen: (NSDictionary *)userParams utmParams:(NSDictionary *)utmParams) {
    dispatch_async(dispatch_get_main_queue(), ^(void) {
        [SCGateway.shared triggerLeadGenWithPresentingController:[[[UIApplication sharedApplication] keyWindow] rootViewController] params:userParams utmParams: utmParams];
    });
}
RCT_REMAP_METHOD(triggerLeadGenWithLoginCta,
                  userParams: (NSDictionary *)userParams
                  utmParams:(NSDictionary *)utmParams
                  showLoginCta:(BOOL *)showLoginCta
                  leadGenGenWithResolver: (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject
                  ) {
    dispatch_async(dispatch_get_main_queue(), ^(void) {
       [SCGateway.shared
        triggerLeadGenWithPresentingController:[[[UIApplication sharedApplication] keyWindow] rootViewController] params:userParams utmParams:utmParams retargeting:false showLoginCta:showLoginCta completion:^(NSString * leadGenResponse) {
           resolve(leadGenResponse);
       }];
    });
}
//MARK: User logout
RCT_REMAP_METHOD(logoutUser,
                 logoutUserWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
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
//MARK: Loans
RCT_REMAP_METHOD(setupLoans,
                 loanConfig: (NSDictionary *)loanConfig
                 setupLoansWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject
                 ) {
    dispatch_async(dispatch_get_main_queue(), ^(void) {
        if(loanConfig != nil && loanConfig[@"gatewayName"] != nil) {
            NSString *gatewayName = loanConfig[@"gatewayName"];
            NSLog(@" ----------- Gateway Name: %@", gatewayName);
            NSString *envName = [NSString stringWithFormat:@"%@", loanConfig[@"environment"]];
            NSLog(@" ----------- Env Name: %@", envName);
            NSNumber *lasEnv = @0;
            if([envName isEqualToString:@"production"]) {
                lasEnv = @0;
            }
            else if([envName isEqualToString:@"development"]) {
                lasEnv = @1;
            } else {
                lasEnv = @2;
            }
            ScLoanConfig *gatewayLoanConfig = [[ScLoanConfig alloc] initWithGatewayName:gatewayName environment:lasEnv];
            [ScLoan.instance setupWithConfig:gatewayLoanConfig completion:^(ScLoanSuccess * success, ScLoanError * error) {
                if(error != nil) {
                    reject([NSString stringWithFormat:@"%li", (long)error.errorCode], error.errorMessage, [self scLoanErrorToDict:error]);
                    return;
                }
                resolve([self scLoanSuccessToDict:success]);
            }];
        }
    });
}
RCT_REMAP_METHOD(apply,
                 loanInfo: (NSDictionary *)loanInfo
                 applyWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject
                 ) {
    dispatch_async(dispatch_get_main_queue(), ^(void) {
        if(loanInfo != nil && loanInfo[@"interactionToken"] != nil) {
            NSString *interactionToken = loanInfo[@"interactionToken"];
            NSLog(@" ----------- Interaction Token: %@", interactionToken);
            ScLoanInfo *gatewayLoanInfo = [[ScLoanInfo alloc] initWithInteractionToken:interactionToken];
            [ScLoan.instance applyWithPresentingController:[[[UIApplication sharedApplication] keyWindow] rootViewController] loanInfo:gatewayLoanInfo completion:^(ScLoanSuccess * success, ScLoanError * error) {
                if(error != nil) {
                    reject([NSString stringWithFormat:@"%li", (long)error.errorCode], error.errorMessage, [self scLoanErrorToDict:error]);
                    return;
                }
                resolve([self scLoanSuccessToDict:success]);
            }];
        }
    });
}
RCT_REMAP_METHOD(pay,
                 loanInfo: (NSDictionary *)loanInfo
                 payWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject
                 ) {
    dispatch_async(dispatch_get_main_queue(), ^(void) {
        if(loanInfo != nil && loanInfo[@"interactionToken"] != nil) {
            NSString *interactionToken = loanInfo[@"interactionToken"];
            NSLog(@" ----------- Interaction Token: %@", interactionToken);
            ScLoanInfo *gatewayLoanInfo = [[ScLoanInfo alloc] initWithInteractionToken:interactionToken];
            [ScLoan.instance payWithPresentingController:[[[UIApplication sharedApplication] keyWindow] rootViewController] loanInfo:gatewayLoanInfo completion:^(ScLoanSuccess * success, ScLoanError * error) {
                if(error != nil) {
                    reject([NSString stringWithFormat:@"%li", (long)error.errorCode], error.errorMessage, [self scLoanErrorToDict:error]);
                    return;
                }
                resolve([self scLoanSuccessToDict:success]);
            }];
        }
    });
}
RCT_REMAP_METHOD(withdraw,
                 loanInfo: (NSDictionary *)loanInfo
                 withdrawWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject
                 ) {
    dispatch_async(dispatch_get_main_queue(), ^(void) {
        if(loanInfo != nil && loanInfo[@"interactionToken"] != nil) {
            NSString *interactionToken = loanInfo[@"interactionToken"];
            NSLog(@" ----------- Interaction Token: %@", interactionToken);
            ScLoanInfo *gatewayLoanInfo = [[ScLoanInfo alloc] initWithInteractionToken:interactionToken];
            [ScLoan.instance withdrawWithPresentingController:[[[UIApplication sharedApplication] keyWindow] rootViewController] loanInfo:gatewayLoanInfo completion:^(ScLoanSuccess * success, ScLoanError * error) {
                if(error != nil) {
                    reject([NSString stringWithFormat:@"%li", (long)error.errorCode], error.errorMessage, [self scLoanErrorToDict:error]);
                    return;
                }
                resolve([self scLoanSuccessToDict:success]);
            }];
        }
    });
}
RCT_REMAP_METHOD(service,
                 loanInfo: (NSDictionary *)loanInfo
                 serviceWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject
                 ) {
    dispatch_async(dispatch_get_main_queue(), ^(void) {
        if(loanInfo != nil && loanInfo[@"interactionToken"] != nil) {
            NSString *interactionToken = loanInfo[@"interactionToken"];
            NSLog(@" ----------- Interaction Token: %@", interactionToken);
            ScLoanInfo *gatewayLoanInfo = [[ScLoanInfo alloc] initWithInteractionToken:interactionToken];
            [ScLoan.instance serviceWithPresentingController:[[[UIApplication sharedApplication] keyWindow] rootViewController] loanInfo:gatewayLoanInfo completion:^(ScLoanSuccess * success, ScLoanError * error) {
                if(error != nil) {
                    reject([NSString stringWithFormat:@"%li", (long)error.errorCode], error.errorMessage, [self scLoanErrorToDict:error]);
                    return;
                }
                resolve([self scLoanSuccessToDict:success]);
            }];
        }
    });
}
RCT_REMAP_METHOD(triggerInteraction,
                 loanInfo: (NSDictionary *)loanInfo
                 triggerInteractionWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject
                 ) {
    dispatch_async(dispatch_get_main_queue(), ^(void) {
        if(loanInfo != nil && loanInfo[@"interactionToken"] != nil) {
            NSString *interactionToken = loanInfo[@"interactionToken"];
            NSLog(@" ----------- Interaction Token: %@", interactionToken);
            ScLoanInfo *gatewayLoanInfo = [[ScLoanInfo alloc] initWithInteractionToken:interactionToken];
            [ScLoan.instance triggerInteractionWithPresentingController:[[[UIApplication sharedApplication] keyWindow] rootViewController] loanInfo:gatewayLoanInfo completion:^(ScLoanSuccess * success, ScLoanError * error) {
                if(error != nil) {
                    reject([NSString stringWithFormat:@"%li", (long)error.errorCode], error.errorMessage, [self scLoanErrorToDict:error]);
                    return;
                }
                resolve([self scLoanSuccessToDict:success]);
            }];
        }
    });
}
//MARK: MixPanel Events
RCT_REMAP_METHOD(startAnalyticsListener,
                 startAnalyticsListenerWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^(void) {
        // Add observer for analytics notifications
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(handleAnalyticsNotification:)
                                                     name:SCGateway.scgNotificationName
                                                   object:nil];
        resolve(@(YES));
    });
}
// Method to stop listening to analytics notifications
RCT_REMAP_METHOD(stopAnalyticsListener,
                 stopAnalyticsListenerWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^(void) {
        [[NSNotificationCenter defaultCenter] removeObserver:self
                                                         name:SCGateway.scgNotificationName
                                                       object:nil];
        resolve(@(YES));
    });
}
- (NSArray<NSString *> *)supportedEvents {
    return @[@"scg_notification"];
}
- (void)handleAnalyticsNotification:(NSNotification *)notification {
    NSString *jsonString = notification.object;
    [self sendEventWithName:@"scg_notification" body:jsonString];
}
- (NSDictionary *)scLoanSuccessToDict:(ScLoanSuccess *)success {
    NSMutableDictionary *successDict = [NSMutableDictionary dictionary];
    successDict[@"isSuccess"] = @(success.isSuccess);
    id data = success.data;
    if (data && ![data isKindOfClass:[NSNull class]]) {
    successDict[@"data"] = data;
    }
    return successDict;
}
- (NSError *)scLoanErrorToDict:(ScLoanError *)error {
    NSMutableDictionary *responseDict = [[NSMutableDictionary alloc] init];
    [responseDict setValue:[NSNumber numberWithInteger:error.errorCode]  forKey:@"code"];
    [responseDict setValue:error.errorMessage  forKey:@"message"];
    [responseDict setValue:error.data  forKey:@"data"];
    [responseDict setValue:@NO  forKey:@"isSuccess"];
    NSError *err = [[NSError alloc] initWithDomain:error.domain code:error.code userInfo:responseDict];
    return err;
}
@end