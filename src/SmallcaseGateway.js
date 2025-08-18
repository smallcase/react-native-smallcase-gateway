import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { ENV } from './constants';
import { safeObject, platformSpecificColorHex } from './util';
import { version } from '../package.json';
import scGatewayEventManager, { 
  SCGatewayEvents, 
  SCGatewayEventTypes,
  // 🆕 Loans support
  scLoansEventManager,
  SCLoansEvents,
  SCLoansEventTypes
} from './SCGatewayEventEmitter';

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

// Event types constants for easy reference - GATEWAY
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

// 🆕 Event types constants for easy reference - LOANS
const LOANS_EVENT_TYPES = {
  ANALYTICS_EVENT: 'scloans_analytics_event',
  SUPER_PROPS_UPDATED: 'scloans_super_properties_updated',
  LOANS_EVENT: 'scloans_event',
  LOANS_NOTIFICATION: 'scloans_notification',
  LOAN_APPLICATION_STARTED: 'loan_application_started',
  LOAN_APPLICATION_COMPLETED: 'loan_application_completed',
  LOAN_APPLICATION_FAILED: 'loan_application_failed',
  LOAN_DISBURSED: 'loan_disbursed',
  LOAN_REPAYMENT: 'loan_repayment'
};

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

// ===== 🆕 LOANS FUNCTIONALITY =====

/**
 * 🏦 Start listening to loans events
 * @returns {Promise<string>}
 */
const startLoansEventListening = async () => {
  try {
    return await SCLoansEvents.startListening();
  } catch (error) {
    console.error('SmallcaseGateway: Failed to start loans event listening:', error);
    throw error;
  }
};

/**
 * 🏦 Stop listening to loans events
 * @returns {Promise<string>}
 */
const stopLoansEventListening = async () => {
  try {
    return await SCLoansEvents.stopListening();
  } catch (error) {
    console.error('SmallcaseGateway: Failed to stop loans event listening:', error);
    throw error;
  }
};

/**
 * 🏦 Post a loans analytics event
 * @param {string} eventName - Name of the event
 * @param {Object} properties - Event properties
 * @returns {Promise<string>}
 */
const postLoansAnalyticsEvent = async (eventName, properties = {}) => {
  try {
    const safeEventName = typeof eventName === 'string' ? eventName : '';
    const safeProperties = safeObject(properties);
    
    return await SCLoansEvents.postAnalyticsEvent(safeEventName, safeProperties);
  } catch (error) {
    console.error('SmallcaseGateway: Failed to post loans analytics event:', error);
    throw error;
  }
};

/**
 * 🏦 Get loans event statistics
 * @returns {Promise<Object>}
 */
const getLoansEventStats = async () => {
  try {
    return await SCLoansEvents.getEventStats();
  } catch (error) {
    console.error('SmallcaseGateway: Failed to get loans event stats:', error);
    return {};
  }
};

/**
 * 🏦 Get loans event listening status
 * @returns {Promise<Object>}
 */
const getLoansEventStatus = async () => {
  try {
    return await SCLoansEvents.getStatus();
  } catch (error) {
    console.error('SmallcaseGateway: Failed to get loans event status:', error);
    return { isListening: false, activeProcessors: [] };
  }
};

/**
 * 🏦 Emit test loans event (debugging)
 * @param {string} eventName - Test event name
 * @param {Object} testData - Test data
 * @returns {Promise<string>}
 */
const emitTestLoansEvent = async (eventName, testData = {}) => {
  try {
    const safeEventName = typeof eventName === 'string' ? eventName : '';
    const safeTestData = safeObject(testData);
    
    return await SCLoansEvents.emitTestEvent(safeEventName, safeTestData);
  } catch (error) {
    console.error('SmallcaseGateway: Failed to emit test loans event:', error);
    throw error;
  }
};

// ===== MAIN EXPORT =====

const SmallcaseGateway = {
  // Core SDK methods (unchanged)
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
  
  // Gateway Events (unchanged)
  eventTypes: EVENT_TYPES,
  gatewayEvents: SCGatewayEvents,
  gatewayEventManager: scGatewayEventManager,
  gatewayEventTypes: SCGatewayEventTypes,

  // 🆕 Loans Events (new)
  loansEventTypes: LOANS_EVENT_TYPES,
  loansEvents: SCLoansEvents,
  loansEventManager: scLoansEventManager,
  loansEventTypesConstants: SCLoansEventTypes,
  
  // 🆕 Loans Methods (new)
  startLoansEventListening,
  stopLoansEventListening,
  postLoansAnalyticsEvent,
  getLoansEventStats,
  getLoansEventStatus,
  emitTestLoansEvent,
};

export default SmallcaseGateway;