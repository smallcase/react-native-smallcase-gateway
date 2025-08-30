// ScLoan.js - Updated implementation with unified cross-platform event system
import { NativeModules, Platform } from 'react-native';
import { safeObject } from './util';
import { ENV } from './constants';
import scLoansEventManager, { SCLoansEventTypes } from './SCLoansEventEmitter';

const { SmallcaseGateway: SmallcaseGatewayNative, SCLoansBridgeEmitter } = NativeModules;

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
 */

// ===== CORE LOAN METHODS =====

/**
 * Setup ScLoans
 * @param {ScLoanConfig} config
 * @returns {Promise}
 * @throws {ScLoanError}
 */
const setup = async (config) => {
    const safeConfig = safeObject(config);
    if(safeConfig.environment === undefined || safeConfig.environment === null) {
        safeConfig.environment = ENV.PROD;
    }

    // Use the appropriate native module based on platform
    const nativeModule = Platform.OS === 'android' && SCLoansBridgeEmitter 
        ? SCLoansBridgeEmitter 
        : SmallcaseGatewayNative;
    
    if (!nativeModule) {
        throw new Error(`SCLoans: Native module not available for ${Platform.OS}`);
    }

    try {
        if (Platform.OS === 'android' && SCLoansBridgeEmitter && typeof SCLoansBridgeEmitter.setupLoans === 'function') {
            console.log('SCLoans: Using Android-specific setup');
            return await SCLoansBridgeEmitter.setupLoans(safeConfig);
        } else {
            console.log('SCLoans: Using SmallcaseGateway setup fallback');
            return await SmallcaseGatewayNative.setupLoans(safeConfig);
        }
    } catch (error) {
        console.error('SCLoans: Setup failed:', error);
        throw error;
    }
};

/**
 * Triggers the LOS Journey
 * @param {ScLoanInfo} loanInfo
 * @returns {Promise}
 * @throws {ScLoanError}
 * @deprecated This method is deprecated use triggerInteraction() instead.
 */
const apply = async (loanInfo) => {
    const safeLoanInfo = safeObject(loanInfo);
    
    try {
        if (Platform.OS === 'android' && SCLoansBridgeEmitter && typeof SCLoansBridgeEmitter.apply === 'function') {
            console.log('SCLoans: Using Android-specific apply');
            return await SCLoansBridgeEmitter.apply(safeLoanInfo);
        } else {
            console.log('SCLoans: Using SmallcaseGateway apply fallback');
            return await SmallcaseGatewayNative.apply(safeLoanInfo);
        }
    } catch (error) {
        console.error('SCLoans: Apply failed:', error);
        throw error;
    }
};

/**
 * Triggers the Repayment Journey
 * @param {ScLoanInfo} loanInfo
 * @returns {Promise}
 * @throws {ScLoanError}
 * @deprecated This method is deprecated use triggerInteraction() instead.
 */
const pay = async (loanInfo) => {
    const safeLoanInfo = safeObject(loanInfo);
    
    try {
        if (Platform.OS === 'android' && SCLoansBridgeEmitter && typeof SCLoansBridgeEmitter.pay === 'function') {
            return await SCLoansBridgeEmitter.pay(safeLoanInfo);
        } else {
            console.log('SCLoans: Using SmallcaseGateway pay fallback');
            return await SmallcaseGatewayNative.pay(safeLoanInfo);
        }
    } catch (error) {
        console.error('SCLoans: Pay failed:', error);
        throw error;
    }
};

/**
 * Triggers the Withdraw Journey
 * @param {ScLoanInfo} loanInfo
 * @returns {Promise}
 * @throws {ScLoanError}
 * @deprecated This method is deprecated use triggerInteraction() instead.
 */
const withdraw = async (loanInfo) => {
    const safeLoanInfo = safeObject(loanInfo);
    
    try {
        if (Platform.OS === 'android' && SCLoansBridgeEmitter && typeof SCLoansBridgeEmitter.withdraw === 'function') {
            return await SCLoansBridgeEmitter.withdraw(safeLoanInfo);
        } else {
            console.log('SCLoans: Using SmallcaseGateway withdraw fallback');
            return await SmallcaseGatewayNative.withdraw(safeLoanInfo);
        }
    } catch (error) {
        console.error('SCLoans: Withdraw failed:', error);
        throw error;
    }
};

/**
 * Triggers the Servicing Journey
 * @param {ScLoanInfo} loanInfo
 * @returns {Promise}
 * @throws {ScLoanError}
 * @deprecated This method is deprecated use triggerInteraction() instead.
 */
const service = async (loanInfo) => {
    const safeLoanInfo = safeObject(loanInfo);
    
    try {
        if (Platform.OS === 'android' && SCLoansBridgeEmitter && typeof SCLoansBridgeEmitter.service === 'function') {
            return await SCLoansBridgeEmitter.service(safeLoanInfo);
        } else {
            console.log('SCLoans: Using SmallcaseGateway service fallback');
            return await SmallcaseGatewayNative.service(safeLoanInfo);
        }
    } catch (error) {
        console.error('SCLoans: Service failed:', error);
        throw error;
    }
};

/**
 * Triggers the triggerInteraction function
 * @param {ScLoanInfo} loanInfo
 * @returns {Promise}
 * @throws {ScLoanError}
 */
const triggerInteraction = async (loanInfo) => {
    const safeLoanInfo = safeObject(loanInfo);
    
    try {
        if (Platform.OS === 'android' && SCLoansBridgeEmitter && typeof SCLoansBridgeEmitter.triggerInteraction === 'function') {
            return await SCLoansBridgeEmitter.triggerInteraction(safeLoanInfo);
        } else {
            console.log('SCLoans: Using SmallcaseGateway triggerInteraction fallback');
            return await SmallcaseGatewayNative.triggerInteraction(safeLoanInfo);
        }
    } catch (error) {
        console.error('SCLoans: TriggerInteraction failed:', error);
        throw error;
    }
};

// ===== 💰 LOANS EVENT METHODS =====

/**
 * 🎧 Subscribe to Loans Events - Convenience wrapper
 * @param {string} eventType - Event type to listen to
 * @param {function} callback - Callback function
 * @returns {object} subscription - Subscription object with remove() method
 */
const subscribeToLoansEvent = (eventType, callback) => {
  return scLoansEventManager.subscribe(eventType, callback);
};

/**
 * 🔕 Unsubscribe from Loans Event
 * @param {object} subscription - Subscription returned from subscribeToLoansEvent
 */
const unsubscribeFromLoansEvent = (subscription) => {
  scLoansEventManager.unsubscribe(subscription);
};

/**
 * 🧹 Clean up all Loans Event listeners
 */
const cleanupLoansEvents = () => {
  scLoansEventManager.cleanup();
};

/**
 * 🎯 Convenience method: Subscribe to loan application events
 */
const subscribeToLoanApplicationEvents = (callbacks) => {
  const subscriptions = [];
  
  if (callbacks.onStarted) {
    subscriptions.push(scLoansEventManager.onLoanApplicationStarted(callbacks.onStarted));
  }
  if (callbacks.onCompleted) {
    subscriptions.push(scLoansEventManager.onLoanApplicationCompleted(callbacks.onCompleted));
  }
  if (callbacks.onFailed) {
    subscriptions.push(scLoansEventManager.onLoanApplicationFailed(callbacks.onFailed));
  }
  
  return subscriptions;
};

/**
 * 🎯 Convenience method: Subscribe to loan status events
 */
const subscribeToLoanStatusEvents = (callbacks) => {
  const subscriptions = [];
  
  if (callbacks.onApproved) {
    subscriptions.push(scLoansEventManager.onLoanApproved(callbacks.onApproved));
  }
  if (callbacks.onRejected) {
    subscriptions.push(scLoansEventManager.onLoanRejected(callbacks.onRejected));
  }
  if (callbacks.onDisbursed) {
    subscriptions.push(scLoansEventManager.onLoanDisbursed(callbacks.onDisbursed));
  }
  if (callbacks.onStatusUpdated) {
    subscriptions.push(scLoansEventManager.onLoanStatusUpdated(callbacks.onStatusUpdated));
  }
  
  return subscriptions;
};

/**
 * 🎯 Convenience method: Subscribe to payment events
 */
const subscribeToPaymentEvents = (callbacks) => {
  const subscriptions = [];
  
  if (callbacks.onPaymentDue) {
    subscriptions.push(scLoansEventManager.onPaymentDue(callbacks.onPaymentDue));
  }
  if (callbacks.onPaymentCompleted) {
    subscriptions.push(scLoansEventManager.onPaymentCompleted(callbacks.onPaymentCompleted));
  }
  if (callbacks.onPaymentFailed) {
    subscriptions.push(scLoansEventManager.onPaymentFailed(callbacks.onPaymentFailed));
  }
  
  return subscriptions;
};

// ===== MAIN EXPORT =====

const ScLoan = {
  // 🎯 Core loan methods
  setup,
  apply,
  pay,
  withdraw,
  service,
  triggerInteraction,
  
  // 🎯 Loans Event System (NEW - Unified)
  loansEventManager: scLoansEventManager,
  loansEventTypes: SCLoansEventTypes,
  subscribeToLoansEvent,
  unsubscribeFromLoansEvent,
  cleanupLoansEvents,
  
  // 🎯 Convenience event subscription methods
  subscribeToLoanApplicationEvents,
  subscribeToLoanStatusEvents,
  subscribeToPaymentEvents,
  
  // 🎯 Platform information
  platform: Platform.OS,
  isAndroidBridgeAvailable: Platform.OS === 'android' && !!SCLoansBridgeEmitter,
  isIosBridgeAvailable: Platform.OS === 'ios' && !!SmallcaseGatewayNative,
};

export default ScLoan;