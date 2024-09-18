/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  CreateUnityInteractionTokenPayload,
  CreateUnityUserPayload,
} from '../models/Loans/ScLoanModels';
import {basePayload} from '../screens/LoansScreen';
import * as Sentry from '@sentry/react-native';

type Environment = {
  name: string;
  gatewayName: string;
  baseUrl: string;
  index: number;
};

const _headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT',
  Accept: 'application/json',
};
const _headerJsonContent = {
  // 'Access-Control-Allow-Origin': '*',
  // 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT',
  // Accept: 'application/json',
  'content-type': 'application/json',
};
const _headerUrlEncodedContent = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT',
  Accept: 'application/json',
  'content-type': 'application/x-www-form-urlencoded',
};
let txnId = '';

function getLatestTxnId(): string {
  return txnId;
}

async function getSmallcaseAuthJwt(
  environment: Environment,
  userId: string,
): Promise<{authJwt: string; connected: boolean}> {
  console.log(`getSmallcaseAuthJwt: ${userId}`);
  const details = {
    id: userId,
  };

  let formEntries: string[] = [];
  Object.entries(details).forEach((entry, value) => {
    var encodedKey = encodeURIComponent(entry[0]);
    var encodedValue = encodeURIComponent(entry[1]);
    formEntries.push(encodedKey + '=' + encodedValue);
  });
  let formBody = formEntries.join('&');

  console.log(`getSmallcaseAuthJwt formBody: ${formBody}`);

  try {
    let response = await fetch(`${environment.baseUrl}user/login`, {
      method: 'POST',
      headers: _headerUrlEncodedContent,
      body: formBody,
    });
    if (response.status === 200) {
      let resJson = await response.json();
      console.log(`getSmallcaseAuthJwt resJson: ${JSON.stringify(resJson)}`);
      return {
        authJwt: resJson.smallcaseAuthToken as string,
        connected: resJson.connected as boolean,
      };
    } else {
      throw response.status.toString();
    }
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}

async function sendSmallcaseAuthJwt(
  environment: Environment,
  smallcaseAuthToken: string,
  userId: string,
): Promise<Object> {
  const body = JSON.stringify({
    id: userId,
    smallcaseAuthToken: smallcaseAuthToken,
  });

  const url = `${environment.baseUrl}user/connect`;
  try {
    console.log('sending token to sm backend with body: ' + body);
    const response = await fetch(url, {
      method: 'POST',
      headers: _headerJsonContent,
      body: body,
    });
    console.log('res from sm backend: ' + JSON.stringify(response));
    let resJson = await response.json();
    if (response.status === 200) {
      return resJson as string;
    } else {
      console.log(
        'sendSmallcaseAuthJwt response error: ' + JSON.stringify(resJson),
      );
      const resText = response.toString;
      console.log('sendSmallcaseAuthJwt response error text: ' + resText);
      throw response.status.toString();
    }
  } catch (error) {
    Sentry.captureException(error);
    console.log('sendSmallcaseAuthJwt error: ' + error);
    throw error;
  }
}

async function getTransactionId(
  environment: Environment,
  intent: string,
  userId: string,
  orderConfig: Object | null,
  assetConfig: Object | null,
  notes: string | null,
): Promise<string> {
  const body = JSON.stringify({
    id: userId,
    intent: intent,
    orderConfig: orderConfig,
    assetConfig: assetConfig,
    notes: notes,
  });
  const url = `${environment.baseUrl}transaction/new`;
  console.log(`getTransactionId URL -> ${url}`);
  console.log('get txnId body: ' + body);
  try {
    const r = fetch(url, {
      method: 'POST',
      headers: _headerJsonContent,
      body: body,
    });
    console.log(`txn request: ${JSON.stringify(r)}`);
    const response = await r;
    console.log(`txn res type: ${JSON.stringify(response)}`);
    if (response.status === 200) {
      let resJson = await response.json();
      console.log('get txnId success: ' + JSON.stringify(resJson));
      txnId = resJson.transactionId as string;
      return txnId;
    } else {
      const resError = await response.text();
      console.log('get txnId error: ' + resError);
      throw resError;
    }
  } catch (error) {
    Sentry.captureException(error);
    console.log('get txnId error catch: ' + error);
    throw error;
  }
}

async function getHoldings(
  environment: Environment,
  userId: string,
  version: number = 1,
  mfEnabled: boolean = false,
): Promise<any> {
  console.log('getHoldings userId: ' + userId);
  const url = `${environment.baseUrl}holdings/fetch?id=${userId}&version=v${version}&mfHoldings=${mfEnabled}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: _headerJsonContent,
    });
    const resJson = await response.json();
    // console.log('get holdings res: ' + JSON.stringify(response));
    console.log('get holdings resJson: ' + JSON.stringify(resJson));
    return resJson.data.data;
  } catch (error) {
    Sentry.captureException(error);
    console.log(`getHoldings error ${error} of type ${typeof error}`);
    throw error;
  }
}

async function postbackSearch(
  environment: Environment,
  transactionId: string,
): Promise<Object> {
  const url = `${environment.baseUrl}transaction/response?transactionId=${transactionId}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: _headerJsonContent,
    });
    const resJson = await response.json();
    // console.log('get holdings res: ' + JSON.stringify(response));
    console.log('postbackSearch resJson: ' + JSON.stringify(resJson));
    return resJson;
  } catch (error) {
    Sentry.captureException(error);
    console.log(`postbackSearch error ${error} of type ${typeof error}`);
    throw error;
  }
}

async function createUnityUser(
  environment: Environment,
  payload: CreateUnityUserPayload,
): Promise<string> {
  const url = `${environment.baseUrl}las/user`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: _headerJsonContent,
      body: JSON.stringify(payload),
    });
    const resJson = await response.json();
    console.log('createUnityUser resJson: ' + JSON.stringify(resJson));
    return JSON.stringify(resJson);
  } catch (error) {
    Sentry.captureException(error);
    console.log(`createUnityUser error ${error} of type ${typeof error}`);
    throw error;
  }
}

async function getUnityUser(
  environment: Environment,
  userId: string | null,
): Promise<string> {
  const url = `${environment.baseUrl}las/user?id=${userId}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: _headerJsonContent,
    });
    const resJson = await response.json();
    // console.log('get holdings res: ' + JSON.stringify(response));
    console.log('getUnityUser resJson: ' + JSON.stringify(resJson));
    return JSON.stringify(resJson);
  } catch (error) {
    Sentry.captureException(error);
    console.log(`getUnityUser error ${error} of type ${typeof error}`);
    throw error;
  }
}

async function getUnityUserLoanSummary(
  environment: Environment,
  lasId: string | null,
): Promise<{
  success: string;
  data: {
    journeyStatus: {
      flags: any;
      lender: string;
      loans: {
        lid: string;
        status: string;
        type: string;
      }[];
    };
  };
}> {
  const url = `${environment.baseUrl}las/loans-status?id=${lasId}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: _headerJsonContent,
    });
    const resJson = await response.json();
    console.log('getUnityUserLoanSummary resJson: ' + JSON.stringify(resJson));
    return resJson;
  } catch (error) {
    Sentry.captureException(error);
    console.log(
      `getUnityUserLoanSummary error ${error} of type ${typeof error}`,
    );
    throw error;
  }
}

async function createGuestInteractionToken(
  environment: Environment,
  payload: typeof basePayload,
): Promise<string> {
  const url = `${environment.baseUrl}las/interaction`;
  console.log(`payload: ${JSON.stringify(payload)}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: _headerJsonContent,
      body: JSON.stringify(payload),
    });
    const resJson = await response.json();
    console.log(
      'createGuestUnityInteractionToken resJson: ' + JSON.stringify(resJson),
    );
    return JSON.stringify(resJson);
  } catch (error) {
    Sentry.captureException(error);
    console.log(
      `createGuestUnityInteractionToken error ${error} of type ${typeof error}`,
    );
    throw error;
  }
}

async function createUnityInteractionToken(
  environment: Environment,
  payload: CreateUnityInteractionTokenPayload,
): Promise<string> {
  console.log(`payload: ${JSON.stringify(payload)}`);
  const url = `${environment.baseUrl}las/interaction`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: _headerJsonContent,
      body: JSON.stringify(payload),
    });
    const resJson = await response.json();
    // console.log('get holdings res: ' + JSON.stringify(response));
    console.log(
      'createUnityInteractionToken resJson: ' + JSON.stringify(resJson),
    );
    return JSON.stringify(resJson);
  } catch (error) {
    Sentry.captureException(error);
    console.log(
      `createUnityInteractionToken error ${error} of type ${typeof error}`,
    );
    throw error;
  }
}

// export type {CreateUnityUserPayload, CreateUnityInteractionTokenPayload};
export {
  getSmallcaseAuthJwt,
  sendSmallcaseAuthJwt,
  getTransactionId,
  getHoldings,
  getLatestTxnId,
  postbackSearch,
  createUnityUser,
  getUnityUser,
  getUnityUserLoanSummary,
  createUnityInteractionToken,
  createGuestInteractionToken,
};
export type {Environment};
