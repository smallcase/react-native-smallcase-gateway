import { NativeModules, Platform } from "react-native";
import { ENV } from "./constants";
import { safeObject, platformSpecificColorHex } from "./util";
import { version } from "../package.json";
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
  const safeGatewayName = typeof gatewayName === "string" ? gatewayName : "";
  const safeEnvName =
    typeof environmentName === "string" ? environmentName : ENV.PROD;

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
  const safeToken = typeof sdkToken === "string" ? sdkToken : "";
  await SmallcaseGatewayNative.init(safeToken);
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
  const safeId = typeof transactionId === "string" ? transactionId : "";

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
 * launches smallcases module
 * 
 * @param {string} targetEndpoint
 * @param {string} params
 */
const launchSmallplug = async (targetEndpoint, params) => {
  const safeEndpoint = safeObject(targetEndpoint);
  const safeParams = safeObject(params);

  return SmallcaseGatewayNative.launchSmallplug(
    targetEndpoint,
    params
  );

}

const safeGatewayName = typeof gatewayName === "string" ? gatewayName : "";
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
const launchSmallplugWithBranding = async (targetEndpoint, params, headerColor, headerOpacity, backIconColor, backIconOpacity) => {
  const safeEndpoint = typeof targetEndpoint === "string" ? targetEndpoint : ""
  const safeParams = typeof params === "string" ? params : ""
  const safeHeaderColor = typeof headerColor === "string" ? headerColor : platformSpecificColorHex("2F363F") 
  const safeHeaderOpacity = typeof headerOpacity === "number" ? headerOpacity : 1
  const safeBackIconColor = typeof backIconColor === "string" ? backIconColor : platformSpecificColorHex("FFFFFF")
  const safeBackIconOpacity = typeof backIconOpacity === "number" ? backIconOpacity : 1

  return Platform.OS === 'android' ?
    SmallcaseGatewayNative.launchSmallplugWithBranding(
      safeEndpoint, safeParams,
      {
        headerColor: safeHeaderColor,
        headerOpacity: safeHeaderOpacity,
        backIconColor: safeBackIconColor,
        backIconOpacity: safeBackIconOpacity
      })
    : SmallcaseGatewayNative.launchSmallplugWithBranding(
      safeEndpoint,
      safeParams,
      safeHeaderColor,
      safeHeaderOpacity,
      safeBackIconColor,
      safeBackIconOpacity
    );

}

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
}

/**
 * Marks a smallcase as archived
 *
 * @param {String} iscid
 */
const archiveSmallcase = async (iscid) => {
  const safeIscid = typeof iscid === "string" ? iscid : "";

  return SmallcaseGatewayNative.archiveSmallcase(safeIscid);
};

/**
 * Returns the native android/ios and react-native sdk version
 * (internal-tracking)
 * @returns {Promise}
 */
const getSdkVersion = async () => {
  return SmallcaseGatewayNative.getSdkVersion(version);
}

const SmallcaseGateway = {
  init,
  logoutUser,
  triggerLeadGen,
  triggerLeadGenWithStatus,
  archiveSmallcase,
  triggerTransaction,
  setConfigEnvironment,
  launchSmallplug,
  launchSmallplugWithBranding,
  getSdkVersion,
  showOrders
};

export default SmallcaseGateway;
