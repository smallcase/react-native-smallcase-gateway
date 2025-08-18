// SCLoans.js - Updated implementation with Android support
import { NativeModules, Platform } from 'react-native';
import { safeObject } from './util';
import { ENV } from './constants';
import scLoansEventManager, { SCLoansEvents, SCLoansEventTypes } from './SCLoansEventEmitter';

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

/**
 * Setup ScLoans
 *
 * @param {ScLoanConfig} config
 * @returns {Promise}
 * @throws {ScLoanError}
 */
const setup = async (config) => {
    const safeConfig = safeObject(config);
    if(safeConfig.environment === undefined || safeConfig.environment === null) safeConfig.environment = ENV.PROD

    // Use the appropriate native module based on platform
    const nativeModule = Platform.OS === 'android' && SCLoansBridgeEmitter 
        ? SCLoansBridgeEmitter 
        : SmallcaseGatewayNative;
    
    if (!nativeModule) {
        throw new Error(`SCLoans: Native module not available for ${Platform.OS}`);
    }

    try {
        if (Platform.OS === 'android' && SCLoansBridgeEmitter && typeof SCLoansBridgeEmitter.setupLoans === 'function') {
            // Use Android-specific setup if available
            return await SCLoansBridgeEmitter.setupLoans(safeConfig);
        } else {
            // Fallback to SmallcaseGateway (iOS or Android fallback)
            console.log('SCLoans: Falling back to SmallcaseGateway for setupLoans method');
            return await SmallcaseGatewayNative.setupLoans(safeConfig);
        }
    } catch (error) {
        console.error('SCLoans: Setup failed:', error);
        throw error;
    }
};

/**
 * Triggers the LOS Journey
 *
 * @param {ScLoanInfo} loanInfo
 * @returns {Promise}
 * @throws {ScLoanError}
 * @deprecated This method is deprecated use triggerInteraction() instead.
 */
const apply = async (loanInfo) => {
    const safeLoanInfo = safeObject(loanInfo);
    
    try {
        console.log('🐛 SCLoan.apply DEBUG:', {
            'Platform.OS': Platform.OS,
            'SCLoansBridgeEmitter exists': !!SCLoansBridgeEmitter,
            'SCLoansBridgeEmitter.apply exists': !!SCLoansBridgeEmitter?.apply,
            'typeof SCLoansBridgeEmitter.apply': typeof SCLoansBridgeEmitter?.apply,
            'SCLoansBridgeEmitter methods': SCLoansBridgeEmitter ? Object.keys(SCLoansBridgeEmitter) : 'null'
        });

        if (Platform.OS === 'android' && SCLoansBridgeEmitter && typeof SCLoansBridgeEmitter.apply === 'function') {
            console.log('🐛 Using SCLoansBridgeEmitter.apply');
            return await SCLoansBridgeEmitter.apply(safeLoanInfo);
        } else {
            console.log('🐛 Falling back to SmallcaseGateway for apply method');
            return await SmallcaseGatewayNative.apply(safeLoanInfo);
        }
    } catch (error) {
        console.error('SCLoans: Apply failed:', error);
        throw error;
    }
};

/**
 * Triggers the Repayment Journey
 *
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
            console.log('SCLoans: Falling back to SmallcaseGateway for pay method');
            return await SmallcaseGatewayNative.pay(safeLoanInfo);
        }
    } catch (error) {
        console.error('SCLoans: Pay failed:', error);
        throw error;
    }
};

/**
 * Triggers the Withdraw Journey
 *
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
            console.log('SCLoans: Falling back to SmallcaseGateway for withdraw method');
            return await SmallcaseGatewayNative.withdraw(safeLoanInfo);
        }
    } catch (error) {
        console.error('SCLoans: Withdraw failed:', error);
        throw error;
    }
};

/**
 * Triggers the Servicing Journey
 *
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
            console.log('SCLoans: Falling back to SmallcaseGateway for service method');
            return await SmallcaseGatewayNative.service(safeLoanInfo);
        }
    } catch (error) {
        console.error('SCLoans: Service failed:', error);
        throw error;
    }
};

/**
 * Triggers the triggerInteraction function
 *
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
            console.log('SCLoans: Falling back to SmallcaseGateway for triggerInteraction method');
            return await SmallcaseGatewayNative.triggerInteraction(safeLoanInfo);
        }
    } catch (error) {
        console.error('SCLoans: TriggerInteraction failed:', error);
        throw error;
    }
};

/**
 * Android-specific methods for testing and analytics
 */
const androidMethods = {
    /**
     * Get debug information (Android only)
     * @returns {Promise<object>}
     */
    getDebugInfo: async () => {
        if (Platform.OS !== 'android' || !SCLoansBridgeEmitter) {
            console.warn('SCLoans: getDebugInfo only available on Android');
            return Promise.resolve({ error: 'Not available on this platform' });
        }
        
        try {
            return await scLoansEventManager.getDebugInfo();
        } catch (error) {
            console.error('SCLoans: getDebugInfo failed:', error);
            throw error;
        }
    },

    /**
     * Get listening status (Android only)
     * @returns {Promise<object>}
     */
    getListeningStatus: async () => {
        if (Platform.OS !== 'android' || !SCLoansBridgeEmitter) {
            return Promise.resolve({ 
                isListening: false,
                platform: Platform.OS,
                error: 'Not available on this platform'
            });
        }
        
        try {
            return await scLoansEventManager.getListeningStatus();
        } catch (error) {
            console.error('SCLoans: getListeningStatus failed:', error);
            throw error;
        }
    },

    /**
     * Emit test event (Android only)
     * @param {string} eventType - Event type to test
     * @param {object} testData - Test data to send
     * @returns {Promise<string>}
     */
    emitTestEvent: async (eventType, testData = null) => {
        if (Platform.OS !== 'android' || !SCLoansBridgeEmitter) {
            console.warn('SCLoans: emitTestEvent only available on Android');
            return Promise.resolve('Not available on this platform');
        }
        
        try {
            return await scLoansEventManager.emitTestEvent(eventType, testData);
        } catch (error) {
            console.error('SCLoans: emitTestEvent failed:', error);
            throw error;
        }
    },

    /**
     * Trigger analytics event (Android only)
     * @param {string} eventName - Event name
     * @param {object} properties - Event properties
     * @returns {Promise<string>}
     */
    triggerAnalyticsEvent: async (eventName, properties = null) => {
        if (Platform.OS !== 'android' || !SCLoansBridgeEmitter) {
            console.warn('SCLoans: triggerAnalyticsEvent only available on Android');
            return Promise.resolve('Not available on this platform');
        }
        
        try {
            return await scLoansEventManager.triggerAnalyticsEvent(eventName, properties);
        } catch (error) {
            console.error('SCLoans: triggerAnalyticsEvent failed:', error);
            throw error;
        }
    },

    /**
     * Trigger super properties update (Android only)
     * @param {object} properties - Super properties
     * @returns {Promise<string>}
     */
    triggerSuperPropertiesUpdate: async (properties = null) => {
        if (Platform.OS !== 'android' || !SCLoansBridgeEmitter) {
            console.warn('SCLoans: triggerSuperPropertiesUpdate only available on Android');
            return Promise.resolve('Not available on this platform');
        }
        
        try {
            return await scLoansEventManager.triggerSuperPropertiesUpdate(properties);
        } catch (error) {
            console.error('SCLoans: triggerSuperPropertiesUpdate failed:', error);
            throw error;
        }
    },

    /**
     * Get supported events (Android only)
     * @returns {Promise<Array>}
     */
    getSupportedEvents: async () => {
        if (Platform.OS !== 'android' || !SCLoansBridgeEmitter) {
            return Promise.resolve(['scloans_notification']);
        }
        
        try {
            return await scLoansEventManager.getSupportedEvents();
        } catch (error) {
            console.error('SCLoans: getSupportedEvents failed:', error);
            throw error;
        }
    },
};

// Export the ScLoan object with proper event handling and Android support
const ScLoan = {
    // Core loan methods (iOS and Android compatible)
    setup,
    apply,
    pay,
    withdraw,
    service,
    triggerInteraction,
    
    // Event handling (compatible with both iOS and Android)
    loansEvents: SCLoansEvents,
    loansEventManager: scLoansEventManager,
    eventTypes: SCLoansEventTypes,
    
    // Android-specific methods
    android: androidMethods,
    
    // Platform information
    platform: Platform.OS,
    isAndroidBridgeAvailable: Platform.OS === 'android' && !!SCLoansBridgeEmitter,
    isIosBridgeAvailable: Platform.OS === 'ios' && !!SmallcaseGatewayNative,
};

export default ScLoan;