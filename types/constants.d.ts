export namespace ENV {
    const STAG: string;
    const DEV: string;
    const PROD: string;
}
export namespace TRANSACTION_TYPE {
    const connect: string;
    const sipSetup: string;
    const fetchFunds: string;
    const transaction: string;
    const holdingsImport: string;
    const authorizeHoldings: string;
    const mfHoldingsImport: string;
}
export namespace ERROR_MSG {
    const init_sdk: string;
    const no_order: string;
    const no_broker: string;
    const invalid_jwt: string;
    const market_closed: string;
    const user_mismatch: string;
    const order_pending: string;
    const internal_error: string;
    const user_cancelled: string;
    const consent_denied: string;
    const order_in_queue: string;
    const invalid_gateway: string;
    const transaction_expired: string;
    const invalid_transactionId: string;
    const insufficient_holdings: string;
    const transaction_in_process: string;
    const no_compatible_browser: string;
}
