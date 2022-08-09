import { NativeModules, Platform } from 'react-native';
import { GATEWAY_ENV } from './constants';

import { version } from '../package.json';
import { safeObject, platformSpecificColorHex } from './util';
const { SmallcaseGateway: SmallcaseGatewayNative } = NativeModules;

export interface EnvConfig {
  /** unique name on consumer */
  gatewayName: string;

  /** leprechaun mode toggle */
  isLeprechaun: boolean;

  /** support AMO (subject to broker support) */
  isAmoEnabled: boolean;

  /** list of broker names */
  brokerList: string[];

  /** environment name */
  environmentName: `${GATEWAY_ENV}`;
}

export interface TransactionRes {
  /** response data */
  data: string;

  /** success flag */
  success: boolean;

  /** error code */
  errorCode?: Number;

  /** transaction name */
  transaction: string;
}

export interface UserDetails {
  name?: string;
  email?: string;
  contact?: string;
  pinCode?: string;
}

let defaultBrokerList: string[] = [];

/**
 * configure the sdk with
 */
const setConfigEnvironment = async (envConfig: EnvConfig): Promise<void> => {
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
    typeof environmentName === 'string' ? environmentName : GATEWAY_ENV.PROD;

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
 */
const init = async (sdkToken: string): Promise<void> => {
  const safeToken = typeof sdkToken === 'string' ? sdkToken : '';
  await SmallcaseGatewayNative.init(safeToken);
};

/**
 * triggers a transaction with a transaction id
 */
const triggerTransaction = async (
  transactionId: string,
  utmParams?: Record<string, string>,
  brokerList?: string[]
): Promise<TransactionRes> => {
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
 * launches smallcases module
 */
const launchSmallplug = async (targetEndpoint: string, params: string) => {
  const safeEndpoint = typeof targetEndpoint === 'string' ? targetEndpoint : '';
  const safeParams = typeof params === 'string' ? params : '';

  return SmallcaseGatewayNative.launchSmallplug(safeEndpoint, safeParams);
};

/**
 * launches smallcases module
 */
const launchSmallplugWithBranding = async (
  targetEndpoint: string,
  params: string,
  headerColor?: string,
  headerOpacity?: number,
  backIconColor?: string,
  backIconOpacity?: number
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
 */
const logoutUser = async (): Promise<void> => {
  return SmallcaseGatewayNative.logoutUser();
};

/**
 * This will display a list of all the orders that a user recently placed.
 * This includes pending, successful, and failed orders.
 */
const showOrders = async (): Promise<void> => {
  return SmallcaseGatewayNative.showOrders();
};

/**
 * triggers the lead gen flow
 */
const triggerLeadGen = (
  userDetails?: UserDetails,
  utmParams?: Record<string, string>
): Promise<void> => {
  const safeParams = safeObject(userDetails);
  const safeUtm = safeObject(utmParams);

  return SmallcaseGatewayNative.triggerLeadGen(safeParams, safeUtm);
};

/**
 * triggers the lead gen flow
 */
const triggerLeadGenWithStatus = async (
  userDetails: UserDetails
): Promise<void> => {
  const safeParams = safeObject(userDetails);

  return SmallcaseGatewayNative.triggerLeadGenWithStatus(safeParams);
};

/**
 * Marks a smallcase as archived
 */
const archiveSmallcase = async (iscid: string): Promise<void> => {
  const safeIscid = typeof iscid === 'string' ? iscid : '';

  return SmallcaseGatewayNative.archiveSmallcase(safeIscid);
};

/**
 * Returns the native android/ios and react-native sdk version
 * (internal-tracking)
 */
const getSdkVersion = async (): Promise<string> => {
  return SmallcaseGatewayNative.getSdkVersion(version);
};

const SmallcaseGateway = {
  init,
  logoutUser,
  showOrders,
  getSdkVersion,
  triggerLeadGen,
  launchSmallplug,
  archiveSmallcase,
  triggerTransaction,
  setConfigEnvironment,
  triggerLeadGenWithStatus,
  launchSmallplugWithBranding,
};

export default SmallcaseGateway;
