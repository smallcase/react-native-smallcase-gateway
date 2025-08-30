import { NativeModules, Platform } from 'react-native';
import { ENV } from './constants';
import { safeObject, platformSpecificColorHex } from './util';
import { version } from '../package.json';
import scGatewayEventManager, { SCGatewayEventTypes } from './SCGatewayEventEmitter';

const { SmallcaseGateway: SmallcaseGatewayNative } = NativeModules;

/**
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
 */

let defaultBrokerList = [];

// 🎯 Gateway Event Types Constants (for backward compatibility)
const EVENT_TYPES = {
  ANALYTICS_EVENT: 'scg_analytics_event',
  SUPER_PROPS_UPDATED: 'scg_analytics_super_props', 
  USER_RESET: 'scg_user_reset',
  USER_IDENTIFY: 'scg_user_identify',
  TRANSACTION_SUCCESS: 'scg_transaction_success',
  TRANSACTION_FAILED: 'scg_transaction_failed',
  LEADGEN_SUCCESS: 'scg_leadgen_success',
  LEADGEN_FAILED: 'scg_leadgen_failed'
};

// ===== CORE SDK METHODS =====

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

  return SmallcaseGatewayNative.setConfigEnvironment(
    safeEnvName,
    safeGatewayName,
    safeIsLeprechaun,
    safeIsAmoEnabled,
    safeBrokerList
  );
};

/**
 * initialize sdk with a session
 * @param {string} sdkToken
 */
const init = async (sdkToken) => {
  const safeToken = typeof sdkToken === 'string' ? sdkToken : '';
  return SmallcaseGatewayNative.init(safeToken);
};

/**
 * triggers a transaction with a transaction id
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
 * @deprecated triggerMfTransaction will be removed soon. Please use triggerTransaction.
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
 */
const launchSmallplug = async (targetEndpoint, params) => {
  const safeEndpoint = typeof targetEndpoint === 'string' ? targetEndpoint : '';
  const safeParams = typeof params === 'string' ? params : '';

  return SmallcaseGatewayNative.launchSmallplug(safeEndpoint, safeParams);
};

/**
 * launches smallcases module with branding
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
 */
const logoutUser = async () => {
  return SmallcaseGatewayNative.logoutUser();
};

/**
 * This will display a list of all the orders that a user recently placed.
 */
const showOrders = async () => {
  return SmallcaseGatewayNative.showOrders();
};

/**
 * triggers the lead gen flow
 */
const triggerLeadGen = (userDetails, utmParams) => {
  const safeParams = safeObject(userDetails);
  const safeUtm = safeObject(utmParams);

  return SmallcaseGatewayNative.triggerLeadGen(safeParams, safeUtm);
};

/**
 * triggers the lead gen flow with status
 */
const triggerLeadGenWithStatus = async (userDetails) => {
  const safeParams = safeObject(userDetails);
  return SmallcaseGatewayNative.triggerLeadGenWithStatus(safeParams);
};

/**
 * triggers the lead gen flow with login CTA
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
 */
const archiveSmallcase = async (iscid) => {
  const safeIscid = typeof iscid === 'string' ? iscid : '';
  return SmallcaseGatewayNative.archiveSmallcase(safeIscid);
};

/**
 * Returns the native android/ios and react-native sdk version
 */
const getSdkVersion = async () => {
  return SmallcaseGatewayNative.getSdkVersion(version);
};

// ===== 🎯 GATEWAY EVENT METHODS =====

/**
 * 🎧 Start listening to Gateway Events via single notification channel
 * @param {function} callback - Callback function to handle all gateway events
 * @returns {object} subscription - Subscription object with remove() method
 */
const startGatewayEventListening = (callback) => {
  return scGatewayEventManager.subscribe(callback);
};

/**
 * 🔕 Unsubscribe from Gateway Event
 * @param {object} subscription - Subscription returned from startGatewayEventListening
 */
const unsubscribeFromGatewayEvent = (subscription) => {
  scGatewayEventManager.unsubscribe(subscription);
};

/**
 * 🧹 Clean up all Gateway Event listeners
 */
const cleanupGatewayEvents = () => {
  scGatewayEventManager.cleanup();
};

/**
 * 🎯 Stop all Gateway Event listening
 */
const stopGatewayEventListening = () => {
  scGatewayEventManager.stopListening();
};

// ===== MAIN EXPORT =====

const SmallcaseGateway = {
  // 🎯 Core SDK methods
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
  
  // 🎯 Gateway Event System (NEW - Unified)
  gatewayEventManager: scGatewayEventManager,
  gatewayEventTypes: SCGatewayEventTypes,
  startGatewayEventListening,
  unsubscribeFromGatewayEvent,
  cleanupGatewayEvents,
  stopGatewayEventListening,
  
  // 🎯 Legacy Event Support (for backward compatibility)
  eventTypes: EVENT_TYPES,
};

export default SmallcaseGateway;