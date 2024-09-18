import * as Sentry from '@sentry/react-native';

const loanApplicationPayload = {
  intent: 'LOAN_APPLICATION',
  config: {
    lender: 'bajaj_finserv',
    userId: '6435739331cff6a7eb84955a',
    opaqueId: '123',
  },
};

const paymentPayload = {
  intent: 'PAYMENT',
  config: {
    amount: '123',
    type: 'charge',
    lender: 'bajaj_finserv',
    userId: '6435739331cff6a7eb84955a',
    opaqueId: '123',
  },
};

const BASE_URL =
  'https://235b-2406-7400-51-aa40-fc5d-2734-b244-39e8.ngrok-free.app/api/';
function interactionUrl(gateway: string): RequestInfo {
  return BASE_URL + `backend/${gateway}/v1/interaction`;
}

async function createInteractionToken(payload: Object): Promise<string> {
  try {
    let response = await fetch(interactionUrl('gatewaydemo-dev'), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    let responseJson = await response.json();
    return responseJson.data.interactionToken;
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}

export {loanApplicationPayload, paymentPayload, createInteractionToken};
