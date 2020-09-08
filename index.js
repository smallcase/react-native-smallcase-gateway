import { NativeModules } from "react-native";

const { SmallcaseGateway: SmallcaseGatewayNative } = NativeModules;

/**
 *
 * @typedef {Object} envConfig
 * @property {string}        gatewayName     - unique name on consumer
 * @property {boolean}       isLeprechaun    - leprechaun mode toggle
 * @property {Array<string>} brokerList      - list of broker names
 * @property {'production' | 'staging' | 'development'}  environmentName - environment name
 *
 * @typedef {Object} transactionRes
 * @property {string}   data        - response data
 * @property {boolean}  success     - success flag
 * @property {Number}   [errorCode] - error code
 * @property {string}   transaction - transaction name
 */

const ENV = {
  STAG: " staging",
  DEV: "development",
  PROD: "production",
};

/**
 * configure the sdk with
 * @param {envConfig} envConfig
 */
const setConfigEnvironment = async (envConfig) => {
  const { brokerList, gatewayName, isLeprechaun, environmentName } = envConfig;

  await SmallcaseGatewayNative.setConfigEnvironment(
    environmentName,
    gatewayName,
    isLeprechaun,
    brokerList
  );
};

/**
 * initialize sdk with a session
 *
 * note: this must be called after `setConfigEnvironment()`
 * @param {string} sdkToken
 */
const init = async (sdkToken) => {
  await SmallcaseGatewayNative.init(sdkToken);
};

/**
 * triggers a transaction with a transaction id
 *
 * @param {string} transactionId
 * @returns {Promise<transactionRes>}
 */
const triggerTransaction = async (transactionId) => {
  return SmallcaseGatewayNative.triggerTransaction(transactionId);
};

const SmallcaseGateway = {
  ENV,
  init,
  triggerTransaction,
  setConfigEnvironment,
};

export default SmallcaseGateway;
