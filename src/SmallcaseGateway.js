import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { ENV } from './constants';
import { safeObject, platformSpecificColorHex } from './util';
import { version } from '../package.json';
import scGatewayEventManager, { SCGatewayEvents, SCGatewayEventTypes } from './SCGatewayEventEmitter';

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

// Create the event emitter instance
const eventEmitter = new NativeEventEmitter(SmallcaseGatewayNative);
const SMALLCASE_GATEWAY_EVENT = 'scg_notification';

// Event types constants for easy reference
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

/**
 * Add an event listener for all SmallcaseGateway events
 * @param {function} listener - Callback function that receives event data
 * @returns {object} - Subscription object with remove() method
 */
function addEventsListener(listener) {
  console.log('🔗 Adding SmallcaseGateway event listener...');
  return eventEmitter.addListener(SMALLCASE_GATEWAY_EVENT, listener);
}

/**
 * Remove all event listeners for SmallcaseGateway events
 */
function removeAllEventsListeners() {
  console.log('🧹 Removing all SmallcaseGateway event listeners...');
  eventEmitter.removeAllListeners(SMALLCASE_GATEWAY_EVENT);
}

/**
 * Remove a specific event listener
 * @param {object} subscription - The subscription object returned by addEventsListener
 */
function removeEventsListener(subscription) {
  if (subscription && subscription.remove) {
    console.log('🧹 Removing specific SmallcaseGateway event listener...');
    subscription.remove();
  }
}

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
  // Core SDK methods
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
  
  // Event handling methods
  addEventsListener,
  removeEventsListener,
  removeAllEventsListeners,
  
  // Event types for reference
  eventTypes: EVENT_TYPES,
  
  // Legacy event support (for backward compatibility)
  events: SCGatewayEvents,
  eventManager: scGatewayEventManager,
  eventTypes_legacy: SCGatewayEventTypes,
};

export default SmallcaseGateway;