import { NativeModules } from 'react-native';
import { safeObject } from './util';
import { ENV } from './constants';
import scLoansEventManager from './SCLoansEventEmitter';
const { SmallcaseGateway: SmallcaseGatewayNative } = NativeModules;

/**
 * @typedef {Object} ScLoanConfig
 * @property {String} gatewayName
 * @property {'production' | 'staging' | 'development'}  environment - environment
 *
 * @typedef {Object} ScLoanInfo
 * @property {String} interactionToken
 *
 * @typedef {Object} ScLoanSuccess
 * @property {boolean} isSuccess
 * @property {string} data
 *
 * @typedef {Object} ScLoanError
 * @property {boolean} isSuccess
 * @property {number} code
 * @property {string} message
 * @property {string} data
 *
 * @typedef {Object} LoansEvent
 * @property {string} type - Event type
 * @property {number} timestamp - Event timestamp
 *
 * @typedef {Object} LoansEventSubscription
 * @property {() => void} remove - Method to unsubscribe from loans events
 */

/**
 * Setup ScLoans    
 *
 * @param {ScLoanConfig} config
 * @returns {Promise<ScLoanSuccess>}
 * @throws {ScLoanError}
 */
const setup = async (config) => {
    const safeConfig = safeObject(config);
    if(safeConfig.environment === undefined || safeConfig.environment === null) safeConfig.environment = ENV.PROD

    return SmallcaseGatewayNative.setupLoans(safeConfig);
  };

/**
 * Triggers the LOS Journey
 *
 * @param {ScLoanInfo} loanInfo
 * @returns {Promise<ScLoanSuccess>}
 * @throws {ScLoanError}
 * @deprecated This method is deprecated use triggerInteraction() instead.
 */
const apply = async (loanInfo) => {
    const safeLoanInfo = safeObject(loanInfo);

    return SmallcaseGatewayNative.apply(safeLoanInfo);
  };

/**
 * Triggers the Repayment Journey
 *
 * @param {ScLoanInfo} loanInfo
 * @returns {Promise<ScLoanSuccess>}
 * @throws {ScLoanError}
 * @deprecated This method is deprecated use triggerInteraction() instead.
 */
const pay = async (loanInfo) => {
    const safeLoanInfo = safeObject(loanInfo);
    return SmallcaseGatewayNative.pay(safeLoanInfo);
  };

/**
 * Triggers the Withdraw Journey
 *
 * @param {ScLoanInfo} loanInfo
 * @returns {Promise<ScLoanSuccess>}
 * @throws {ScLoanError}
 * @deprecated This method is deprecated use triggerInteraction() instead.
 */
const withdraw = async (loanInfo) => {
    const safeLoanInfo = safeObject(loanInfo);
    return SmallcaseGatewayNative.withdraw(safeLoanInfo);
  };

/**
 * Triggers the Servicing Journey
 *
 * @param {ScLoanInfo} loanInfo
 * @returns {Promise<ScLoanSuccess>}
 * @throws {ScLoanError}
 * @deprecated This method is deprecated use triggerInteraction() instead.
 */
const service = async (loanInfo) => {
    const safeLoanInfo = safeObject(loanInfo);

    return SmallcaseGatewayNative.service(safeLoanInfo);
  };

/**
 * Triggers the triggerInteraction function
 *
 * @param {ScLoanInfo} loanInfo
 * @returns {Promise<ScLoanSuccess>}
 * @throws {ScLoanError}
 */
const triggerInteraction = async (loanInfo) => {
  const safeLoanInfo = safeObject(loanInfo);

  return SmallcaseGatewayNative.triggerInteraction(safeLoanInfo);
};

// ===== LOANS EVENT METHODS =====

/**
 * Subscribe to Loans Events
 * @param {(event: LoansEvent) => void} callback - Callback function to handle loans events
 * @returns {LoansEventSubscription} subscription - Subscription object with remove() method
 */
const subscribeToLoansEvent = (callback) => {
    return scLoansEventManager.subscribe(callback);
};

/**
 * Unsubscribe from Loans Events
 * @param {LoansEventSubscription} subscription - Subscription returned from subscribeToLoansEvent
 */
const unsubscribeFromLoansEvent = (subscription) => {
    scLoansEventManager.unsubscribe(subscription);
    
    // Auto-cleanup if no more active subscriptions (following SmallcaseGateway pattern)
    if (scLoansEventManager.hasNoActiveSubscriptions()) {
        scLoansEventManager.cleanup();
        scLoansEventManager.stopListening();
    }
};


const ScLoan = {
    // Core Loans methods
    setup,
    apply,
    pay,
    withdraw,
    service,
    triggerInteraction,
    
    // Loans Event System
    subscribeToLoansEvent,
    unsubscribeFromLoansEvent,
};

export default ScLoan;