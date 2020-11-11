import { NativeModules } from "react-native";
import { ENV, TRANSACTION_TYPE, ERROR_MSG } from "./constants";

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
 */

/**
 * configure the sdk with
 * @param {envConfig} envConfig
 */
const setConfigEnvironment = async (envConfig) => {
  const safeConfig = typeof envConfig === "object" ? envConfig : {};

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
 * @returns {Promise<transactionRes>}
 */
const triggerTransaction = async (transactionId, utmParams) => {
  const safeUtm = typeof utmParams === "object" ? utmParams : {};
  const safeId = typeof transactionId === "string" ? transactionId : "";

  return SmallcaseGatewayNative.triggerTransaction(safeId, safeUtm);
};

/**
 * triggers the lead gen flow
 *
 * @param {userDetails} [params]
 */
const triggerLeadGen = (params) => {
  const safeParams = typeof params === "object" ? params : {};
  return SmallcaseGatewayNative.triggerLeadGen(safeParams);
};

const SmallcaseGateway = {
  ENV,
  init,
  ERROR_MSG,
  triggerLeadGen,
  TRANSACTION_TYPE,
  triggerTransaction,
  setConfigEnvironment,
};

export default SmallcaseGateway;
