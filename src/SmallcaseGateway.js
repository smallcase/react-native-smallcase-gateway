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

// Analytics event types from SCGateway
const AnalyticsEventTypes = {
  ANALYTICS_EVENT: 'analytics_event',
  SUPER_PROPERTIES_UPDATED: 'analytics_super_properties_updated',
  USER_RESET: 'user_reset',
  USER_IDENTIFY: 'user_identify'
};

const eventEmitter = new NativeEventEmitter(SmallcaseGatewayNative);

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
 * Add analytics event listener with proper event type handling
 * @param {Function} callback - Callback function to handle analytics events
 * @returns {Object} - Event subscription object
 */
const addAnalyticsEventListener = (callback) => {
  console.log('🎯 Setting up SCGateway analytics event listener');
  
  const subscription = eventEmitter.addListener('scg_analytics_event', (eventData) => {
    console.log('📊 Raw analytics event received:', eventData);
    
    try {
      const { type, timestamp, data } = eventData;
      
      // Handle different types of analytics events
      switch (type) {
        case AnalyticsEventTypes.ANALYTICS_EVENT:
          handleTrackingEvent(data, timestamp, callback);
          break;
          
        case AnalyticsEventTypes.SUPER_PROPERTIES_UPDATED:
          handleSuperPropertiesUpdate(data, timestamp, callback);
          break;
          
        case AnalyticsEventTypes.USER_RESET:
          handleUserReset(data, timestamp, callback);
          break;
          
        case AnalyticsEventTypes.USER_IDENTIFY:
          handleUserIdentify(data, timestamp, callback);
          break;
          
        default:
          console.log('🔍 Unknown analytics event type:', type);
          // Still call callback with raw data
          callback({
            type: 'unknown',
            timestamp,
            data,
            originalType: type
          });
      }
    } catch (error) {
      console.error('❌ Error processing analytics event:', error);
      console.error('❌ Event data was:', eventData);
      
      // Call callback with error info
      callback({
        type: 'error',
        error: error.message,
        originalData: eventData
      });
    }
  });
  
  console.log('✅ Analytics listener subscription created');
  return subscription;
};


/**
 * Handle tracking events (regular analytics events)
 */
const handleTrackingEvent = (data, timestamp, callback) => {
  const { eventName, properties } = data;
  
  console.log(`📈 Analytics Event: ${eventName}`, properties);
  
  callback({
    type: 'track',
    eventName,
    properties,
    timestamp
  });
};

/**
 * Handle super properties updates
 */
const handleSuperPropertiesUpdate = (data, timestamp, callback) => {
  const { properties } = data;
  
  console.log('🔧 Super Properties Updated:', properties);
  
  callback({
    type: 'super_properties_updated',
    properties,
    timestamp
  });
};

/**
 * Handle user reset events
 */
const handleUserReset = (data, timestamp, callback) => {
  const { id, device_id_sc } = data;
  
  console.log('🔄 User Reset:', { id, device_id_sc });
  
  callback({
    type: 'user_reset',
    userId: id,
    deviceId: device_id_sc,
    timestamp
  });
};

/**
 * Handle user identify events
 */
const handleUserIdentify = (data, timestamp, callback) => {
  const { id } = data;
  
  console.log('👤 User Identify:', id);
  
  callback({
    type: 'user_identify',
    userId: id,
    timestamp
  });
};

/**
 * Remove analytics event listener
 */
const removeAnalyticsEventListener = (subscription) => {
  if (subscription && typeof subscription.remove === 'function') {
    subscription.remove();
    console.log('🗑️ Analytics event listener removed');
  }
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
  addAnalyticsEventListener,
  removeAnalyticsEventListener,
  AnalyticsEventTypes
};

export default SmallcaseGateway;
