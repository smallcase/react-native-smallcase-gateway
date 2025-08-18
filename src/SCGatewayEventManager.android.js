// 📡 SCGatewayEventManager.android.js - Android Event Bridge for React Native
// 🔄 Integrated with both Gateway and Loans functionality
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { SCGatewayBridgeEmitter, SCLoansBridgeEmitter } = NativeModules;

// Module load diagnostics
console.log('[SCGatewayEventManager.android] Module loaded');
console.log('[SCGatewayEventManager.android] Platform:', Platform.OS);
console.log('[SCGatewayEventManager.android] Has SCGatewayBridgeEmitter:', !!SCGatewayBridgeEmitter);
console.log('[SCGatewayEventManager.android] Has SCLoansBridgeEmitter:', !!SCLoansBridgeEmitter);

// Create event emitter instances for Android
let gatewayEventEmitter = null;
let loansEventEmitter = null;

if (Platform.OS === 'android') {
  // Gateway event emitter
  if (SCGatewayBridgeEmitter) {
    try {
      gatewayEventEmitter = new NativeEventEmitter(SCGatewayBridgeEmitter);
      console.log('[SCGatewayEventManager.android] NativeEventEmitter created for SCGatewayBridgeEmitter');
    } catch (e) {
      console.warn('[SCGatewayEventManager.android] Failed to create Gateway NativeEventEmitter:', e);
    }
  } else {
    console.warn('[SCGatewayEventManager.android] Gateway event emitter not created. Module not available.');
  }

  // Loans event emitter
  if (SCLoansBridgeEmitter) {
    try {
      loansEventEmitter = new NativeEventEmitter(SCLoansBridgeEmitter);
      console.log('[SCGatewayEventManager.android] NativeEventEmitter created for SCLoansBridgeEmitter');
    } catch (e) {
      console.warn('[SCGatewayEventManager.android] Failed to create Loans NativeEventEmitter:', e);
    }
  } else {
    console.warn('[SCGatewayEventManager.android] Loans event emitter not created. Module not available.');
  }
}

/**
 * SCGateway Event Types - Matching Android implementation
 */
export const SCGatewayEventTypes = {
  ANALYTICS_EVENT: 'scgateway_analytics_event',
  SUPER_PROPERTIES_UPDATED: 'scgateway_super_properties_updated',
  USER_RESET: 'scgateway_user_reset',
  USER_IDENTIFY: 'scgateway_user_identify',
};

/**
 * SCLoans Event Types - Matching Android implementation and SCLoansBridgeEmitter
 */
export const SCLoansEventTypes = {
  ANALYTICS_EVENT: 'scloans_analytics_event',
  SUPER_PROPERTIES_UPDATED: 'scloans_super_properties_updated',
  USER_RESET: 'scloans_user_reset',
  USER_IDENTIFY: 'scloans_user_identify',
  LOANS_EVENT: 'scloans_event',
  LOANS_NOTIFICATION: 'scloans_notification',
};

/**
 * SCGateway Event Manager for Android
 * Provides methods to listen to analytics events from the native Android SDK
 */
class SCGatewayEventManager {
  constructor() {
    this.listeners = new Map();
    this.isListening = false;
  }

  /**
   * Start listening to SCGateway events
   * @returns {Promise<string>}
   */
  async startListening() {
    if (Platform.OS !== 'android' || !SCGatewayBridgeEmitter) {
      console.warn('SCGatewayEventManager: Not available on this platform');
      return Promise.resolve('Not available');
    }

    console.log('SCGatewayEventManager: Attempting to start listening...');
    try {
      const result = await SCGatewayBridgeEmitter.startListening();
      this.isListening = true;
      console.log('SCGatewayEventManager: Started listening successfully:', result);
      try {
        const status = await this.getListeningStatus();
        console.log('SCGatewayEventManager: Status after startListening ->', status);
      } catch {}
      return result;
    } catch (error) {
      console.error('SCGatewayEventManager: Failed to start listening:', error);
      throw error;
    }
  }

  /**
   * Stop listening to SCGateway events
   * @returns {Promise<string>}
   */
  async stopListening() {
    if (Platform.OS !== 'android' || !SCGatewayBridgeEmitter) {
      return Promise.resolve('Not available');
    }

    console.log('SCGatewayEventManager: Attempting to stop listening...');
    try {
      const result = await SCGatewayBridgeEmitter.stopListening();
      this.isListening = false;
      
      // Remove all listeners
      this.removeAllListeners();
      
      console.log('SCGatewayEventManager: Stopped listening successfully:', result);
      return result;
    } catch (error) {
      console.error('SCGatewayEventManager: Failed to stop listening:', error);
      throw error;
    }
  }

  /**
   * Get current listening status
   * @returns {Promise<object>}
   */
  async getListeningStatus() {
    if (Platform.OS !== 'android' || !SCGatewayBridgeEmitter) {
      return Promise.resolve({ isListening: false, isAnalyticsActive: false });
    }

    try {
      return await SCGatewayBridgeEmitter.getListeningStatus();
    } catch (error) {
      console.error('SCGatewayEventManager: Failed to get status:', error);
      return { isListening: false, isAnalyticsActive: false };
    }
  }

  /**
   * Add listener for a specific event type
   * @param {string} eventType - Event type from SCGatewayEventTypes
   * @param {function} callback - Callback function to handle the event
   * @returns {object} - Subscription object with remove() method
   */
  addEventListener(eventType, callback) {
    console.log(`SCGatewayEventManager: Attempting to add listener for event type: ${eventType}`);
    if (Platform.OS !== 'android' || !gatewayEventEmitter) {
      console.warn('SCGatewayEventManager: Event listening not available on this platform');
      return { remove: () => {} };
    }

    if (!Object.values(SCGatewayEventTypes).includes(eventType)) {
      console.warn(`SCGatewayEventManager: Unknown event type: ${eventType}`);
      return { remove: () => {} };
    }

    // Start listening automatically if not already listening
    if (!this.isListening) {
      console.log('SCGatewayEventManager: Not listening, starting automatically...');
      this.startListening().catch(console.error);
    }

    // Wrap the callback to log arrival
    const wrappedCallback = (payload) => {
      console.log(`[SCGatewayEventManager.android] <- Received native event '${eventType}':`, payload);
      try { callback(payload); } catch (e) { console.error('[SCGatewayEventManager.android] Listener callback error:', e); }
    };

    const subscription = gatewayEventEmitter.addListener(eventType, wrappedCallback);
    console.log(`[SCGatewayEventManager.android] Registered listener for '${eventType}'. Total listeners for type before push:`, (this.listeners.get(eventType) || []).length);
    
    // Store subscription for cleanup
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(subscription);

    console.log(`SCGatewayEventManager: Successfully added listener for ${eventType}. Total now:`, this.listeners.get(eventType).length);

    return {
      remove: () => {
        console.log(`SCGatewayEventManager: Removing listener for ${eventType}`);
        subscription.remove();
        this.removeListenerFromMap(eventType, subscription);
        console.log(`SCGatewayEventManager: Listener for ${eventType} removed.`);
      }
    };
  }

  /**
   * Remove listener for a specific event type
   * @param {string} eventType - Event type from SCGatewayEventTypes
   * @param {function} callback - Callback function to remove
   */
  removeEventListener(eventType, callback) {
    console.log(`SCGatewayEventManager: Attempting to remove listener for event type: ${eventType}`);
    if (Platform.OS !== 'android' || !gatewayEventEmitter) {
      console.warn('SCGatewayEventManager: Event emitter not available on this platform, cannot remove listener.');
      return;
    }

    gatewayEventEmitter.removeListener(eventType, callback);
    console.log(`SCGatewayEventManager: Successfully removed listener for ${eventType}`);
  }

  /**
   * Remove all listeners for a specific event type
   * @param {string} eventType - Event type from SCGatewayEventTypes
   */
  removeAllListeners(eventType = null) {
    console.log(`SCGatewayEventManager: Attempting to remove all listeners for event type: ${eventType || 'all'}`);
    if (Platform.OS !== 'android' || !gatewayEventEmitter) {
      console.warn('SCGatewayEventManager: Event emitter not available on this platform, cannot remove all listeners.');
      return;
    }

    if (eventType) {
      // Remove listeners for specific event type
      const subscriptions = this.listeners.get(eventType) || [];
      console.log(`[SCGatewayEventManager.android] Removing ${subscriptions.length} listener(s) for '${eventType}'`);
      subscriptions.forEach(subscription => subscription.remove());
      this.listeners.delete(eventType);
      
      gatewayEventEmitter.removeAllListeners(eventType);
      console.log(`SCGatewayEventManager: Successfully removed all listeners for ${eventType}`);
    } else {
      // Remove all listeners
      this.listeners.forEach((subscriptions, type) => {
        console.log(`[SCGatewayEventManager.android] Removing ${subscriptions.length} listener(s) for '${type}'`);
        subscriptions.forEach(subscription => subscription.remove());
        gatewayEventEmitter.removeAllListeners(type);
      });
      this.listeners.clear();
      
      console.log('SCGatewayEventManager: Successfully removed all listeners');
    }
  }

  /**
   * Emit a test event (for debugging)
   * @param {string} eventType - Event type to emit
   * @param {object} testData - Test data to include
   * @returns {Promise<string>}
   */
  async emitTestEvent(eventType, testData = {}) {
    if (Platform.OS !== 'android' || !SCGatewayBridgeEmitter) {
      console.warn('SCGatewayEventManager: Test event emission not available on this platform');
      return Promise.resolve('Not available');
    }

    try {
      console.log('[SCGatewayEventManager.android] -> Emitting test event to native:', eventType, testData);
      return await SCGatewayBridgeEmitter.emitTestEvent(eventType, testData);
    } catch (error) {
      console.error('SCGatewayEventManager: Failed to emit test event:', error);
      throw error;
    }
  }

  /**
   * Get supported event types
   * @returns {Promise<string[]>}
   */
  async getSupportedEvents() {
    if (Platform.OS !== 'android' || !SCGatewayBridgeEmitter) {
      return Promise.resolve(Object.values(SCGatewayEventTypes));
    }

    try {
      const events = await SCGatewayBridgeEmitter.getSupportedEvents();
      console.log('[SCGatewayEventManager.android] Native supported events:', events);
      return events;
    } catch (error) {
      console.error('SCGatewayEventManager: Failed to get supported events:', error);
      return Object.values(SCGatewayEventTypes);
    }
  }

  // Private helper method
  removeListenerFromMap(eventType, targetSubscription) {
    console.log(`SCGatewayEventManager: Removing listener from map for event type: ${eventType}`);
    const subscriptions = this.listeners.get(eventType) || [];
    const index = subscriptions.indexOf(targetSubscription);
    if (index > -1) {
      subscriptions.splice(index, 1);
      if (subscriptions.length === 0) {
        this.listeners.delete(eventType);
        console.log(`SCGatewayEventManager: No more listeners for ${eventType}, removing event type from map.`);
      }
    }
  }
}

/**
 * SCLoans Event Manager for Android
 * Provides methods to listen to analytics and general events from the native Loans Android SDK
 */
class SCLoansEventManager {
  constructor() {
    this.listeners = new Map();
    this.isListening = false;
  }

  /**
   * Start listening to SCLoans events
   * @returns {Promise<string>}
   */
  async startListening() {
    if (Platform.OS !== 'android' || !SCLoansBridgeEmitter) {
      console.warn('SCLoansEventManager: Not available on this platform');
      return Promise.resolve('Not available');
    }

    console.log('SCLoansEventManager: Attempting to start listening...');
    try {
      const result = await SCLoansBridgeEmitter.startListening();
      this.isListening = true;
      console.log('SCLoansEventManager: Started listening successfully:', result);
      try {
        const status = await this.getListeningStatus();
        console.log('SCLoansEventManager: Status after startListening ->', status);
      } catch {}
      return result;
    } catch (error) {
      console.error('SCLoansEventManager: Failed to start listening:', error);
      throw error;
    }
  }

  /**
   * Stop listening to SCLoans events
   * @returns {Promise<string>}
   */
  async stopListening() {
    if (Platform.OS !== 'android' || !SCLoansBridgeEmitter) {
      return Promise.resolve('Not available');
    }

    console.log('SCLoansEventManager: Attempting to stop listening...');
    try {
      const result = await SCLoansBridgeEmitter.stopListening();
      this.isListening = false;
      
      // Remove all listeners
      this.removeAllListeners();
      
      console.log('SCLoansEventManager: Stopped listening successfully:', result);
      return result;
    } catch (error) {
      console.error('SCLoansEventManager: Failed to stop listening:', error);
      throw error;
    }
  }

  /**
   * Get current listening status
   * @returns {Promise<object>}
   */
  async getListeningStatus() {
    if (Platform.OS !== 'android' || !SCLoansBridgeEmitter) {
      return Promise.resolve({ isListening: false, isAnalyticsActive: false });
    }

    try {
      return await SCLoansBridgeEmitter.getListeningStatus();
    } catch (error) {
      console.error('SCLoansEventManager: Failed to get status:', error);
      return { isListening: false, isAnalyticsActive: false };
    }
  }

  /**
   * Add listener for a specific event type
   * @param {string} eventType - Event type from SCLoansEventTypes
   * @param {function} callback - Callback function to handle the event
   * @returns {object} - Subscription object with remove() method
   */
  addEventListener(eventType, callback) {
    console.log(`SCLoansEventManager: Attempting to add listener for event type: ${eventType}`);
    if (Platform.OS !== 'android' || !loansEventEmitter) {
      console.warn('SCLoansEventManager: Event listening not available on this platform');
      return { remove: () => {} };
    }

    if (!Object.values(SCLoansEventTypes).includes(eventType)) {
      console.warn(`SCLoansEventManager: Unknown event type: ${eventType}`);
      return { remove: () => {} };
    }

    // Start listening automatically if not already listening
    if (!this.isListening) {
      console.log('SCLoansEventManager: Not listening, starting automatically...');
      this.startListening().catch(console.error);
    }

    // Wrap the callback to log arrival
    const wrappedCallback = (payload) => {
      console.log(`[SCLoansEventManager.android] <- Received native event '${eventType}':`, payload);
      try { callback(payload); } catch (e) { console.error('[SCLoansEventManager.android] Listener callback error:', e); }
    };

    const subscription = loansEventEmitter.addListener(eventType, wrappedCallback);
    console.log(`[SCLoansEventManager.android] Registered listener for '${eventType}'. Total listeners for type before push:`, (this.listeners.get(eventType) || []).length);
    
    // Store subscription for cleanup
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(subscription);

    console.log(`SCLoansEventManager: Successfully added listener for ${eventType}. Total now:`, this.listeners.get(eventType).length);

    return {
      remove: () => {
        console.log(`SCLoansEventManager: Removing listener for ${eventType}`);
        subscription.remove();
        this.removeListenerFromMap(eventType, subscription);
        console.log(`SCLoansEventManager: Listener for ${eventType} removed.`);
      }
    };
  }

  /**
   * Remove listener for a specific event type
   * @param {string} eventType - Event type from SCLoansEventTypes
   * @param {function} callback - Callback function to remove
   */
  removeEventListener(eventType, callback) {
    console.log(`SCLoansEventManager: Attempting to remove listener for event type: ${eventType}`);
    if (Platform.OS !== 'android' || !loansEventEmitter) {
      console.warn('SCLoansEventManager: Event emitter not available on this platform, cannot remove listener.');
      return;
    }

    loansEventEmitter.removeListener(eventType, callback);
    console.log(`SCLoansEventManager: Successfully removed listener for ${eventType}`);
  }

  /**
   * Remove all listeners for a specific event type
   * @param {string} eventType - Event type from SCLoansEventTypes
   */
  removeAllListeners(eventType = null) {
    console.log(`SCLoansEventManager: Attempting to remove all listeners for event type: ${eventType || 'all'}`);
    if (Platform.OS !== 'android' || !loansEventEmitter) {
      console.warn('SCLoansEventManager: Event emitter not available on this platform, cannot remove all listeners.');
      return;
    }

    if (eventType) {
      // Remove listeners for specific event type
      const subscriptions = this.listeners.get(eventType) || [];
      console.log(`[SCLoansEventManager.android] Removing ${subscriptions.length} listener(s) for '${eventType}'`);
      subscriptions.forEach(subscription => subscription.remove());
      this.listeners.delete(eventType);
      
      loansEventEmitter.removeAllListeners(eventType);
      console.log(`SCLoansEventManager: Successfully removed all listeners for ${eventType}`);
    } else {
      // Remove all listeners
      this.listeners.forEach((subscriptions, type) => {
        console.log(`[SCLoansEventManager.android] Removing ${subscriptions.length} listener(s) for '${type}'`);
        subscriptions.forEach(subscription => subscription.remove());
        loansEventEmitter.removeAllListeners(type);
      });
      this.listeners.clear();
      
      console.log('SCLoansEventManager: Successfully removed all listeners');
    }
  }

  /**
   * Emit a test event (for debugging)
   * @param {string} eventName - Event name to emit
   * @param {object} testData - Test data to include
   * @returns {Promise<string>}
   */
  async emitTestEvent(eventName, testData = {}) {
    if (Platform.OS !== 'android' || !SCLoansBridgeEmitter) {
      console.warn('SCLoansEventManager: Test event emission not available on this platform');
      return Promise.resolve('Not available');
    }

    try {
      console.log('[SCLoansEventManager.android] -> Emitting test event to native:', eventName, testData);
      return await SCLoansBridgeEmitter.emitTestEvent(eventName, testData);
    } catch (error) {
      console.error('SCLoansEventManager: Failed to emit test event:', error);
      throw error;
    }
  }

  /**
   * Post analytics event (direct analytics call) - using triggerAnalyticsEvent from SCLoansBridgeEmitter
   * @param {string} eventName - Analytics event name
   * @param {object} properties - Event properties
   * @returns {Promise<string>}
   */
  async postAnalyticsEvent(eventName, properties = {}) {
    if (Platform.OS !== 'android' || !SCLoansBridgeEmitter) {
      console.warn('SCLoansEventManager: Analytics event posting not available on this platform');
      return Promise.resolve('Not available');
    }

    try {
      console.log('[SCLoansEventManager.android] -> Posting analytics event to native:', eventName, properties);
      return await SCLoansBridgeEmitter.triggerAnalyticsEvent(eventName, properties);
    } catch (error) {
      console.error('SCLoansEventManager: Failed to post analytics event:', error);
      throw error;
    }
  }

  /**
   * Trigger super properties update (using triggerSuperPropertiesUpdate from SCLoansBridgeEmitter)
   * @param {object} properties - Properties to update
   * @returns {Promise<string>}
   */
  async triggerSuperPropertiesUpdate(properties = {}) {
    if (Platform.OS !== 'android' || !SCLoansBridgeEmitter) {
      console.warn('SCLoansEventManager: Super properties update not available on this platform');
      return Promise.resolve('Not available');
    }

    try {
      console.log('[SCLoansEventManager.android] -> Triggering super properties update:', properties);
      return await SCLoansBridgeEmitter.triggerSuperPropertiesUpdate(properties);
    } catch (error) {
      console.error('SCLoansEventManager: Failed to trigger super properties update:', error);
      throw error;
    }
  }

  /**
   * Get debug info (using getDebugInfo from SCLoansBridgeEmitter)
   * @returns {Promise<object>}
   */
  async getDebugInfo() {
    if (Platform.OS !== 'android' || !SCLoansBridgeEmitter) {
      return Promise.resolve({});
    }

    try {
      return await SCLoansBridgeEmitter.getDebugInfo();
    } catch (error) {
      console.error('SCLoansEventManager: Failed to get debug info:', error);
      return {};
    }
  }

  /**
   * Get event statistics (fallback implementation)
   * @returns {Promise<object>}
   */
  async getEventStats() {
    try {
      const debugInfo = await this.getDebugInfo();
      return {
        isListening: this.isListening,
        activeListeners: this.listeners.size,
        ...debugInfo
      };
    } catch (error) {
      console.error('SCLoansEventManager: Failed to get event stats:', error);
      return {};
    }
  }

  /**
   * Get cached events (not available in current implementation)
   * @returns {Promise<array>}
   */
  async getCachedEvents() {
    console.warn('SCLoansEventManager: getCachedEvents not implemented in native bridge');
    return Promise.resolve([]);
  }

  /**
   * Get supported event types
   * @returns {Promise<string[]>}
   */
  async getSupportedEvents() {
    if (Platform.OS !== 'android' || !SCLoansBridgeEmitter) {
      return Promise.resolve(Object.values(SCLoansEventTypes));
    }

    try {
      const events = await SCLoansBridgeEmitter.getSupportedEvents();
      console.log('[SCLoansEventManager.android] Native supported events:', events);
      return events;
    } catch (error) {
      console.error('SCLoansEventManager: Failed to get supported events:', error);
      return Object.values(SCLoansEventTypes);
    }
  }

  // Private helper method
  removeListenerFromMap(eventType, targetSubscription) {
    console.log(`SCLoansEventManager: Removing listener from map for event type: ${eventType}`);
    const subscriptions = this.listeners.get(eventType) || [];
    const index = subscriptions.indexOf(targetSubscription);
    if (index > -1) {
      subscriptions.splice(index, 1);
      if (subscriptions.length === 0) {
        this.listeners.delete(eventType);
        console.log(`SCLoansEventManager: No more listeners for ${eventType}, removing event type from map.`);
      }
    }
  }
}

// Create and export singleton instances
const scGatewayEventManager = new SCGatewayEventManager();
const scLoansEventManager = new SCLoansEventManager();

export default scGatewayEventManager;

/**
 * Convenience methods for common use cases - GATEWAY
 */
export const SCGatewayEvents = {
  /**
   * Listen to analytics events
   * @param {function} callback - Function to handle analytics events
   * @returns {object} - Subscription object
   */
  onAnalyticsEvent: (callback) => {
    return scGatewayEventManager.addEventListener(
      SCGatewayEventTypes.ANALYTICS_EVENT,
      callback
    );
  },

  /**
   * Listen to super properties updates
   * @param {function} callback - Function to handle super properties updates
   * @returns {object} - Subscription object
   */
  onSuperPropertiesUpdated: (callback) => {
    return scGatewayEventManager.addEventListener(
      SCGatewayEventTypes.SUPER_PROPERTIES_UPDATED,
      callback
    );
  },

  /**
   * Listen to user reset events
   * @param {function} callback - Function to handle user reset events
   * @returns {object} - Subscription object
   */
  onUserReset: (callback) => {
    return scGatewayEventManager.addEventListener(
      SCGatewayEventTypes.USER_RESET,
      callback
    );
  },

  /**
   * Listen to user identify events
   * @param {function} callback - Function to handle user identify events
   * @returns {object} - Subscription object
   */
  onUserIdentify: (callback) => {
    return scGatewayEventManager.addEventListener(
      SCGatewayEventTypes.USER_IDENTIFY,
      callback
    );
  },

  /**
   * Start listening to all events
   */
  startListening: () => scGatewayEventManager.startListening(),

  /**
   * Stop listening to all events
   */
  stopListening: () => scGatewayEventManager.stopListening(),

  /**
   * Remove all event listeners
   */
  removeAllListeners: () => scGatewayEventManager.removeAllListeners(),

  /**
   * Get current status
   */
  getStatus: () => scGatewayEventManager.getListeningStatus(),

  /**
   * Emit test event (for debugging)
   */
  emitTestEvent: (eventType, testData) => scGatewayEventManager.emitTestEvent(eventType, testData),
};

/**
 * Convenience methods for common use cases - LOANS
 */
export const SCLoansEvents = {
  /**
   * Listen to analytics events
   * @param {function} callback - Function to handle analytics events
   * @returns {object} - Subscription object
   */
  onAnalyticsEvent: (callback) => {
    return scLoansEventManager.addEventListener(
      SCLoansEventTypes.ANALYTICS_EVENT,
      callback
    );
  },

  /**
   * Listen to super properties updates
   * @param {function} callback - Function to handle super properties updates
   * @returns {object} - Subscription object
   */
  onSuperPropertiesUpdated: (callback) => {
    return scLoansEventManager.addEventListener(
      SCLoansEventTypes.SUPER_PROPERTIES_UPDATED,
      callback
    );
  },

  /**
   * Listen to user reset events
   * @param {function} callback - Function to handle user reset events
   * @returns {object} - Subscription object
   */
  onUserReset: (callback) => {
    return scLoansEventManager.addEventListener(
      SCLoansEventTypes.USER_RESET,
      callback
    );
  },

  /**
   * Listen to user identify events
   * @param {function} callback - Function to handle user identify events
   * @returns {object} - Subscription object
   */
  onUserIdentify: (callback) => {
    return scLoansEventManager.addEventListener(
      SCLoansEventTypes.USER_IDENTIFY,
      callback
    );
  },

  /**
   * Listen to general loans events
   * @param {function} callback - Function to handle loans events
   * @returns {object} - Subscription object
   */
  onLoansEvent: (callback) => {
    return scLoansEventManager.addEventListener(
      SCLoansEventTypes.LOANS_EVENT,
      callback
    );
  },

  /**
   * Listen to loans notifications
   * @param {function} callback - Function to handle loans notifications
   * @returns {object} - Subscription object
   */
  onLoansNotification: (callback) => {
    return scLoansEventManager.addEventListener(
      SCLoansEventTypes.LOANS_NOTIFICATION,
      callback
    );
  },

  /**
   * Start listening to all loans events
   */
  startListening: () => scLoansEventManager.startListening(),

  /**
   * Stop listening to all loans events
   */
  stopListening: () => scLoansEventManager.stopListening(),

  /**
   * Remove all loans event listeners
   */
  removeAllListeners: () => scLoansEventManager.removeAllListeners(),

  /**
   * Get current loans status
   */
  getStatus: () => scLoansEventManager.getListeningStatus(),

  /**
   * Emit test loans event (for debugging)
   */
  emitTestEvent: (eventName, testData) => scLoansEventManager.emitTestEvent(eventName, testData),

  /**
   * Post analytics event directly
   */
  postAnalyticsEvent: (eventName, properties) => scLoansEventManager.postAnalyticsEvent(eventName, properties),

  /**
   * Trigger super properties update
   */
  triggerSuperPropertiesUpdate: (properties) => scLoansEventManager.triggerSuperPropertiesUpdate(properties),

  /**
   * Get loans event statistics
   */
  getEventStats: () => scLoansEventManager.getEventStats(),

  /**
   * Get cached loans events
   */
  getCachedEvents: () => scLoansEventManager.getCachedEvents(),

  /**
   * Get debug info
   */
  getDebugInfo: () => scLoansEventManager.getDebugInfo(),
};

/**
 * Export loans event manager instance as well
 */
export { scLoansEventManager };