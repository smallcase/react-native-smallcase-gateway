import {
  getSmallcaseAuthJwt,
  getTransactionId,
  sendSmallcaseAuthJwt,
  getHoldings,
  Environment,
} from './SmartInvestingService';

import SmallcaseGateway from 'react-native-smallcase-gateway';
import {
  Holding,
  HoldingsData,
  HoldingsDataV2,
  MutualFunds,
  Positions,
  PrivateV2,
  PublicSmallcase,
  SecurityV2,
  SmallcasesV2,
  Stats,
} from '../models/HoldingsModels';
import {Alert, Platform, ToastAndroid} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {OrderConfig} from '../models/SstModels';
import {userDetails as ScgUserDetails} from 'react-native-smallcase-gateway/src/SmallcaseGateway';
import * as Sentry from '@sentry/react-native';

const GATEWAY_ENV = SmallcaseGateway.ENV;
const transactionType = SmallcaseGateway.TRANSACTION_TYPE;

function getSdkVersion(): any {
  return SmallcaseGateway.getSdkVersion();
}

function getGatewayEnvFromIndex(envIndex: number): any {
  switch (envIndex) {
    case 1:
      return GATEWAY_ENV.DEV;
    case 2:
      return GATEWAY_ENV.STAG;
    default:
      return GATEWAY_ENV.PROD;
  }
}

async function setEnvironment(
  env: Environment,
  gwName: string | null,
  userId: string,
  isLeprechaun: boolean,
  isAmoEnabled: boolean,
  jwt: string | null,
): Promise<boolean> {
  try {
    const gatewayName = gwName ?? env.gatewayName;
    const configResponse = await SmallcaseGateway.setConfigEnvironment({
      isLeprechaun: isLeprechaun,
      isAmoEnabled: isAmoEnabled,
      gatewayName: gatewayName,
      // `environmentName` should always be PROD, regardless of your environment
      environmentName: getGatewayEnvFromIndex(env.index),
      brokerList: [],
    });
    console.log('configResponse: ' + configResponse);
    console.log('get authJwt userId: ' + userId);
    let authJwtResult = {authJwt: jwt, connected: false};
    if (authJwtResult.authJwt === null) {
      console.log(`Executing getSmallcaseAuthJwt ${authJwtResult.authJwt}`);
      authJwtResult = await getSmallcaseAuthJwt(env, userId);
    }
    console.log('authJwt: ' + authJwtResult);
    if (typeof authJwtResult.authJwt !== 'string') {
      throw new Error('authToken is invalid');
    }
    const initGatewayResponse = await SmallcaseGateway.init(
      authJwtResult.authJwt,
    );
    console.log('initGatewayResponse: ' + initGatewayResponse);
    alert('Set Environment', 'Successful!!');
    return authJwtResult.connected;
  } catch (error) {
    console.log('Setup Error stringified - ' + JSON.stringify(error));
    Sentry.captureException(error);
    alert('Setup Error', getErrorString(error));
    return false;
  }
}

async function connect(env: Environment, userId: string): Promise<Boolean> {
  try {
    const transactionId = await getTransactionId(
      env,
      transactionType.connect as string,
      userId,
      null,
      null,
      null,
    );
    console.log('transactionId: ' + transactionId);
    const transactionResponse = await SmallcaseGateway.triggerTransaction(
      transactionId,
      {
        test: 'test',
      },
    );
    console.log('transactionResponse: ' + JSON.stringify(transactionResponse));
    alert('Connect', JSON.stringify(transactionResponse));
    let shouldSendToken =
      JSON.parse(transactionResponse.data).smallcaseAuthToken != null &&
      userId !== null &&
      userId !== '';
    console.log(`connect shouldSendToken -> ${shouldSendToken}`);
    if (shouldSendToken) {
      const token = JSON.parse(transactionResponse.data).smallcaseAuthToken;
      const res = await sendSmallcaseAuthJwt(env, token, userId);
      console.log(res);
    }
    return true;
  } catch (error) {
    console.log('connect error stringified - ' + JSON.stringify(error));
    Sentry.captureException(error);
    alert('Connect Error', getErrorString(error));
    return false;
  }
}

async function triggerMftxn(env: Environment, transactionId: string) {
  try {
    console.log('triggerMftxn txn id: ' + transactionId);
    const res = await SmallcaseGateway.triggerMfTransaction(transactionId);
    console.log('triggerMftxn res: ' + JSON.stringify(res));
    await alert('triggerMftxn', JSON.stringify(res));
  } catch (error) {
    console.log('triggerMftxn error - ' + error);
    console.log('triggerMftxn error stringified - ' + JSON.stringify(error));
    Sentry.captureException(error);
    await alert('triggerMftxn Error', getErrorString(error));
  }
}

async function placeSstOrder(
  env: Environment,
  userId: string,
  orderConfig: OrderConfig,
) {
  try {
    const transactionId = await getTransactionId(
      env,
      transactionType.transaction as string,
      userId,
      orderConfig,
      null,
      null,
    );
    console.log('sst txn id: ' + transactionId);
    const res = await SmallcaseGateway.triggerTransaction(transactionId, {
      test: 'test',
    });
    console.log('sst res: ' + JSON.stringify(res));
    alert('Sst', JSON.stringify(res));
  } catch (error) {
    console.log('Sst error stringified - ' + JSON.stringify(error));
    Sentry.captureException(error);
    alert('Sst Error', getErrorString(error));
  }
}

async function showOrders() {
  try {
    const showOrdersRes = await SmallcaseGateway.showOrders();
    alert('Show Orders', JSON.stringify(showOrdersRes));
  } catch (error) {
    console.log('Show Orders error stringified - ' + JSON.stringify(error));
    Sentry.captureException(error);
    alert('Show Orders Error', getErrorString(error));
  }
}

async function authorizeHoldings(env: Environment, userId: string) {
  try {
    const transactionId = await getTransactionId(
      env,
      transactionType.authorizeHoldings as string,
      userId,
      null,
      null,
      null,
    );
    console.log('authorizeHoldings txn id: ' + transactionId);
    const res = await SmallcaseGateway.triggerTransaction(transactionId, {
      test: 'test',
    });
    console.log('authorizeHoldings res: ' + JSON.stringify(res));
    alert('Authorize Holdings', JSON.stringify(res));
  } catch (error) {
    console.log(
      'Authorize Holdings error stringified - ' + JSON.stringify(error),
    );
    Sentry.captureException(error);
    alert('Authorize Holdings Error', getErrorString(error));
  }
}

async function reconcileHoldings(env: Environment, userId: string) {
  try {
    const transactionId = await getTransactionId(
      env,
      transactionType.transaction as string,
      userId,
      {type: 'RECONCILIATION'},
      null,
      null,
    );
    const res = await SmallcaseGateway.triggerTransaction(transactionId);
    console.log('reconcileHoldings res: ' + JSON.stringify(res));
    alert('Reconcile Holdings', JSON.stringify(res));
  } catch (error) {
    console.log(typeof error);
    Sentry.captureException(error);
    if (typeof error === 'string') {
      alert('reconcileHoldings Error', error);
      throw error;
    }
    console.log(
      'reconcileHoldings error stringified - ' + JSON.stringify(error),
    );
    alert('reconcileHoldings Error', getErrorString(error));
    throw error;
  }
}

async function importHoldings(
  env: Environment,
  userId: string,
  assetConfig: Object,
): Promise<string> {
  try {
    if (userId.length === 0) {
      throw 'userId is not defined. Enter userId on ConnectScreen and set Environment again.';
    }
    const transactionId = await getTransactionId(
      env,
      transactionType.holdingsImport as string,
      userId,
      null,
      assetConfig,
      null,
    );
    console.log('importHoldings txn id: ' + transactionId);
    const res = await SmallcaseGateway.triggerTransaction(transactionId, {
      test: 'test',
    });
    console.log('importHoldings res: ' + JSON.stringify(res));
    alert('Import Holdings', JSON.stringify(res));
    return res.data;
  } catch (error) {
    console.log(typeof error);
    Sentry.captureException(error);
    if (typeof error === 'string') {
      alert('importHoldings Error', error);
      throw error;
    }
    console.log('importHoldings error stringified - ' + JSON.stringify(error));
    alert('importHoldings Error', getErrorString(error));
    throw error;
  }
}

async function showHoldingsV2(
  env: Environment,
  userId: string,
  mfEnabled: boolean = false,
): Promise<HoldingsDataV2> {
  try {
    if (userId.length === 0) {
      throw 'Holdings For Guest Users Not Available. userId is not defined. Enter userId on ConnectScreen and set Environment again.';
    }
    const holdings = await getHoldings(env, userId, 2, mfEnabled);
    // console.log('showHoldings res: ' + JSON.stringify(holdings));
    alert('ShowHoldings', JSON.stringify(holdings));
    // console.log(HoldingsDataV2.assign(holdings));
    const model = new HoldingsDataV2(
      holdings.lastUpdate,
      holdings.securities?.map(
        (s: any) =>
          new SecurityV2(
            new Holding(
              '',
              '',
              '',
              s.holdings.averagePrice,
              s.holdings.quantity,
            ),
            new Positions(
              new Holding(
                '',
                '',
                '',
                s.positions.nse.averagePrice,
                s.positions.nse.quantity,
              ),
              new Holding(
                '',
                '',
                '',
                s.positions.bse.averagePrice,
                s.positions.bse.quantity,
              ),
            ),
            s.transactableQuantity,
            s.smallcaseQuantity,
            s.nseTicker,
            s.bseTicker,
            s.isin,
            s.name,
          ),
      ),
      new SmallcasesV2(
        new PrivateV2(
          holdings.smallcases?.private?.investments?.map(
            (i: any) =>
              new PublicSmallcase(
                i.scid,
                i.name,
                i.investmentDetailsURL,
                i.shortDescription,
                i.imageUrl,
                new Stats(i.stats.currentValue, i.stats.totalReturns),
                [],
              ),
          ),
        ),
        holdings.smallcases?.public?.map(
          (p: any) =>
            new PublicSmallcase(
              p.scid,
              p.name,
              p.investmentDetailsURL,
              p.shortDescription,
              p.imageUrl,
              new Stats(p.stats.currentValue, p.stats.totalReturns),
              [],
            ),
        ),
      ),
      holdings.snapshotDate,
      holdings.updating,
      MutualFunds.fromObj(holdings.mutualFunds),
    );
    return model;
  } catch (error) {
    Sentry.captureException(error);
    if (typeof error === 'undefined') {
      alert('showHoldings Error', 'undefined');
      throw error;
    }
    if (typeof error === 'string') {
      alert('showHoldings Error', error);
      throw error;
    }
    console.log('showHoldings error stringified - ' + JSON.stringify(error));
    alert('showHoldings Error', getErrorString(error));
    throw error;
  }
}

async function showHoldings(
  env: Environment,
  userId: string,
  mfEnabled: boolean = false,
): Promise<HoldingsData | null> {
  try {
    if (userId.length === 0) {
      throw 'Holdings For Guest Users Not Available. userId is not defined. Enter userId on ConnectScreen and set Environment again.';
    }
    const holdings = await getHoldings(env, userId, 1, mfEnabled);
    // console.log('showHoldings res: ' + JSON.stringify(holdings));
    alert('ShowHoldings', JSON.stringify(holdings));
    return HoldingsData.fromObj(holdings);
  } catch (error) {
    console.log(typeof error);
    Sentry.captureException(error);
    if (typeof error === 'undefined') {
      alert('showHoldings Error', 'undefined');
      throw error;
    }
    if (typeof error === 'string') {
      alert('showHoldings Error', error);
      throw error;
    }
    console.log('showHoldings error stringified - ' + JSON.stringify(error));
    alert('showHoldings Error', getErrorString(error));
    throw error;
  }
}

async function fetchFunds(env: Environment, userId: string): Promise<number> {
  try {
    if (userId.length === 0) {
      throw 'userId is not defined. Enter userId on ConnectScreen and set Environment again.';
    }
    const transactionId = await getTransactionId(
      env,
      transactionType.fetchFunds as string,
      userId,
      null,
      null,
      null,
    );
    console.log('fetchFunds txn id: ' + transactionId);
    const res = await SmallcaseGateway.triggerTransaction(transactionId, {
      test: 'test',
    });
    console.log('fetchFunds res: ' + JSON.stringify(res));
    const resData = JSON.parse(res.data);
    alert('Fetch Funds', JSON.stringify(res));
    return resData.data.funds;
  } catch (error) {
    Sentry.captureException(error);
    if (typeof error === 'string') {
      alert('fetchFunds Error', error);
      throw error;
    }
    console.log('fetchFunds error stringified - ' + JSON.stringify(error));
    // alert('fetchFunds Error', getErrorString(error));
    throw error;
  }
}

interface UIConfig {
  headerColor: string | null;
  headerOpacity: number;
  backIconColor: string | null;
  backIconOpacity: number;
}

async function launchSmallPlug(
  targetEndpoint: any,
  params: any,
  uiConfig: UIConfig,
) {
  try {
    console.log(`launchSmallPlug start ${JSON.stringify(uiConfig)}`);
    const res = await SmallcaseGateway.launchSmallplugWithBranding(
      targetEndpoint,
      params,
      uiConfig.headerColor ?? '',
      uiConfig.headerOpacity,
      uiConfig.backIconColor ?? '',
      uiConfig.backIconOpacity,
    );
    console.log(`launch dm res -> ${JSON.stringify(res)}`);
    alert('Launch Smallplug Success', JSON.stringify(res));
  } catch (error) {
    Sentry.captureException(error);
    console.log(
      'Launch Smallplug error stringified - ' + JSON.stringify(error),
    );
    alert('Launch Smallplug Error', getErrorString(error));
  }
}

async function leadGen(userDetails: ScgUserDetails, showLoginCta?: boolean) {
  console.log(`leadGen ${userDetails}`);
  try {
    let response = '';
    if (showLoginCta !== undefined) {
      response = await SmallcaseGateway.triggerLeadGenWithLoginCta(
        userDetails,
        null,
        showLoginCta,
      );
    } else {
      response = await SmallcaseGateway.triggerLeadGenWithStatus(userDetails);
    }
    alert('LeadGen', response);
    console.log(`lead gen res: ${response}`);
  } catch (error) {
    Sentry.captureException(error);
    console.log('LeadGen error stringified - ' + JSON.stringify(error));
    alert('LeadGen Error', getErrorString(error));
  }
}

async function logout() {
  try {
    const res = await SmallcaseGateway.logoutUser();
    alert('Logout', `${res}`);
  } catch (error) {
    Sentry.captureException(error);
    console.log('Logout Error error stringified - ' + JSON.stringify(error));
    alert('Logout Error', getErrorString(error));
    throw error;
  }
}

async function triggerTxn(txnId: string) {
  try {
    const res = await SmallcaseGateway.triggerTransaction(txnId, {
      test: 'test',
    });
    alert('TriggerTxn', `${JSON.stringify(res)}`);
  } catch (error) {
    Sentry.captureException(error);
    console.log('TriggerTxn error stringified - ' + JSON.stringify(error));
    alert('TriggerTxn Error', getErrorString(error));
  }
}

const sleep = (ms: number) =>
  new Promise(resolve => setTimeout((): void => resolve(undefined), ms));
const copyToClipboard = (value: string) => {
  Clipboard.setString(value);
};

function showToast(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Alert', message);
  }
}

function getErrorString(error: any) {
  Sentry.captureException(error);
  console.log(`getErrorString: ${error}`);
  return JSON.stringify(error.userInfo);
}

async function alert(resType: string, response: string) {
  await sleep(1000);
  console.log('alerting');
  return await new Promise<void>(function (resolve, _) {
    Alert.alert(`${resType}`, `${response}`, [
      {
        text: 'Copy',
        onPress: () => {
          copyToClipboard(response);
          resolve();
        },
      },
      {
        text: 'Cancel',
        onPress: () => {
          console.log('Cancel Pressed');
          resolve();
        },
        style: 'cancel',
      },
    ]);
  });
}
export {
  showHoldings,
  showHoldingsV2,
  importHoldings,
  placeSstOrder,
  connect,
  setEnvironment,
  launchSmallPlug,
  fetchFunds,
  leadGen,
  logout,
  copyToClipboard,
  triggerTxn,
  authorizeHoldings,
  showToast,
  getSdkVersion,
  showOrders,
  getTransactionId,
  triggerMftxn,
  alert,
  reconcileHoldings,
  getGatewayEnvFromIndex,
};
