export const ENV = {
  STAG: "staging",
  DEV: "development",
  PROD: "production",
};

export const TRANSACTION_TYPE = {
  connect: "CONNECT",
  sipSetup: "SIP_SETUP",
  fetchFunds: "FETCH_FUNDS",
  transaction: "TRANSACTION",
  holdingsImport: "HOLDINGS_IMPORT",
  authorizeHoldings: "AUTHORISE_HOLDINGS",
};

export const ERROR_MSG = {
  init_sdk: "init_sdk",
  no_broker: "no_broker",
  invalid_jwt: "invalid_jwt",
  market_closed: "market_closed",
  user_mismatch: "user_mismatch",
  order_pending: "order_pending",
  internal_error: "internal_error",
  user_cancelled: "user_cancelled",
  consent_denied: "consent_denied",
  order_in_queue: "order_in_queue",
  invalid_gateway: "invalid_gateway",
  transaction_expired: "transaction_expired",
  invalid_transactionId: "invalid_transactionId",
  insufficient_holdings: "insufficient_holdings",
  transaction_in_process: "transaction_in_process",
};
