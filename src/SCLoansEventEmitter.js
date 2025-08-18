import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { SCLoansBridgeEmitter } = NativeModules;

// Create event emitter instance
let eventEmitter = null;
if (SCLoansBridgeEmitter) {
  if (Platform.OS === 'ios') {
    eventEmitter = new NativeEventEmitter(SCLoansBridgeEmitter);
  }
  // For Android, we'll use the DeviceEventEmitter which is handled natively
}

/**
 * SCLoans Event Types
 */
export const SCLoansEventTypes = {
  NOTIFICATION: 'scloans_notification',
  // Android-specific event types
  ANALYTICS_EVENT: 'scloans_analytics_event',
  SUPER_PROPERTIES_UPDATED: 'scloans_super_properties_updated',
  USER_RESET: 'scloans_user_reset',
  USER_IDENTIFY: 'scloans_user_identify',
};

/**
 * SCLoans Event Manager
 * Provides methods to listen to analytics events from both iOS and Android native SDKs
 */
class SCLoansEventManager {
  constructor() {
    this.listeners = new Map();
    this.isListening = false;
    this.androidListeners = new Map(); // For Android DeviceEventEmitter listeners
  }

  /**
   * Start listening to SCLoans events
   * @returns {Promise<string>}
   */
  async startListening() {
    if (!SCLoansBridgeEmitter) {
      console.warn('SCLoansEventManager: Not available on this platform');
      return Promise.resolve('Not available');
    }

    console.log('SCLoansEventManager: Attempting to start listening...');
    try {
      const result = await SCLoansBridgeEmitter.startListening();
      this.isListening = true;
      console.log('SCLoansEventManager: Started listening successfully:', result);
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
    if (!SCLoansBridgeEmitter) {
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
   * Get debug information from the native module
   * @returns {Promise<object>}
   */
  async getDebugInfo() {
    if (!SCLoansBridgeEmitter) {
      console.warn('SCLoansEventManager: Not available on this platform');
      return Promise.resolve({ error: 'Not available' });
    }

    console.log('SCLoansEventManager: Getting debug info...');
    try {
      const debugInfo = await SCLoansBridgeEmitter.getDebugInfo();
      console.log('SCLoansEventManager: Debug info:', debugInfo);
      return debugInfo;
    } catch (error) {
      console.error('SCLoansEventManager: Failed to get debug info:', error);
      throw error;
    }
  }

  /**
   * Get listening status
   * @returns {Promise<object>}
   */
  async getListeningStatus() {
    if (!SCLoansBridgeEmitter || !SCLoansBridgeEmitter.getListeningStatus) {
      return Promise.resolve({ 
        isListening: this.isListening,
        platform: Platform.OS 
      });
    }

    try {
      const status = await SCLoansBridgeEmitter.getListeningStatus();
      return status;
    } catch (error) {
      console.error('SCLoansEventManager: Failed to get listening status:', error);
      return { 
        isListening: this.isListening,
        platform: Platform.OS,
        error: error.message 
      };
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
    
    if (!SCLoansBridgeEmitter) {
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

    let subscription;

    if (Platform.OS === 'ios') {
      // iOS: Use NativeEventEmitter, always listen to 'scloans_notification'
      if (!eventEmitter) {
        console.warn('SCLoansEventManager: Event emitter not available on iOS');
        return { remove: () => {} };
      }

      const wrappedCallback = (data) => {
        console.log(`SCLoansEventManager: Received iOS notification with data:`, data);
        callback(data);
      };

      subscription = eventEmitter.addListener(SCLoansEventTypes.NOTIFICATION, wrappedCallback);
      
      // Store subscription for cleanup
      if (!this.listeners.has(eventType)) {
        this.listeners.set(eventType, []);
      }
      this.listeners.get(eventType).push(subscription);

    } else if (Platform.OS === 'android') {
      // Android: Use DeviceEventEmitter directly for specific event types
      const { DeviceEventEmitter } = require('react-native');
      
      const wrappedCallback = (data) => {
        console.log(`SCLoansEventManager: Received Android event ${eventType} with data:`, data);
        callback(data);
      };

      subscription = DeviceEventEmitter.addListener(eventType, wrappedCallback);
      
      // Store subscription for cleanup
      if (!this.androidListeners.has(eventType)) {
        this.androidListeners.set(eventType, []);
      }
      this.androidListeners.get(eventType).push(subscription);
    }

    console.log(`SCLoansEventManager: Successfully added listener for ${eventType} on ${Platform.OS}`);

    return {
      remove: () => {
        console.log(`SCLoansEventManager: Removing listener for ${eventType}`);
        if (subscription) {
          subscription.remove();
          if (Platform.OS === 'ios') {
            this.removeListenerFromMap(eventType, subscription);
          } else if (Platform.OS === 'android') {
            this.removeAndroidListenerFromMap(eventType, subscription);
          }
        }
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
    
    if (!SCLoansBridgeEmitter) {
      console.warn('SCLoansEventManager: Event emitter not available on this platform, cannot remove listener.');
      return;
    }

    if (Platform.OS === 'ios' && eventEmitter) {
      eventEmitter.removeListener(eventType, callback);
    } else if (Platform.OS === 'android') {
      const { DeviceEventEmitter } = require('react-native');
      DeviceEventEmitter.removeListener(eventType, callback);
    }
    
    console.log(`SCLoansEventManager: Successfully removed listener for ${eventType}`);
  }

  /**
   * Remove all listeners for a specific event type
   * @param {string} eventType - Event type from SCLoansEventTypes
   */
  removeAllListeners(eventType = null) {
    console.log(`SCLoansEventManager: Attempting to remove all listeners for event type: ${eventType || 'all'}`);
    
    if (!SCLoansBridgeEmitter) {
      console.warn('SCLoansEventManager: Event emitter not available on this platform, cannot remove all listeners.');
      return;
    }

    if (Platform.OS === 'ios') {
      if (eventType) {
        // Remove listeners for specific event type
        const subscriptions = this.listeners.get(eventType) || [];
        subscriptions.forEach(subscription => subscription.remove());
        this.listeners.delete(eventType);
        
        if (eventEmitter) {
          eventEmitter.removeAllListeners(eventType);
        }
        console.log(`SCLoansEventManager: Successfully removed all iOS listeners for ${eventType}`);
      } else {
        // Remove all listeners
        this.listeners.forEach((subscriptions, type) => {
          subscriptions.forEach(subscription => subscription.remove());
          if (eventEmitter) {
            eventEmitter.removeAllListeners(type);
          }
        });
        this.listeners.clear();
        console.log('SCLoansEventManager: Successfully removed all iOS listeners');
      }
    } else if (Platform.OS === 'android') {
      const { DeviceEventEmitter } = require('react-native');
      
      if (eventType) {
        // Remove listeners for specific event type
        const subscriptions = this.androidListeners.get(eventType) || [];
        subscriptions.forEach(subscription => subscription.remove());
        this.androidListeners.delete(eventType);
        
        DeviceEventEmitter.removeAllListeners(eventType);
        console.log(`SCLoansEventManager: Successfully removed all Android listeners for ${eventType}`);
      } else {
        // Remove all listeners
        this.androidListeners.forEach((subscriptions, type) => {
          subscriptions.forEach(subscription => subscription.remove());
          DeviceEventEmitter.removeAllListeners(type);
        });
        this.androidListeners.clear();
        console.log('SCLoansEventManager: Successfully removed all Android listeners');
      }
    }
  }

  /**
   * Get current listening status
   * @returns {boolean}
   */
  getListeningStatusSync() {
    return this.isListening;
  }

  /**
   * Emit test event (Android only)
   * @param {string} eventType - Event type to test
   * @param {object} testData - Test data to send
   * @returns {Promise<string>}
   */
  async emitTestEvent(eventType, testData = null) {
    if (Platform.OS !== 'android' || !SCLoansBridgeEmitter || !SCLoansBridgeEmitter.emitTestEvent) {
      console.warn('SCLoansEventManager: Test event emission only available on Android');
      return Promise.resolve('Not available on this platform');
    }

    try {
      const result = await SCLoansBridgeEmitter.emitTestEvent(eventType, testData);
      console.log(`SCLoansEventManager: Test event emitted successfully: ${eventType}`);
      return result;
    } catch (error) {
      console.error('SCLoansEventManager: Failed to emit test event:', error);
      throw error;
    }
  }

  /**
   * Trigger analytics event (Android only)
   * @param {string} eventName - Event name
   * @param {object} properties - Event properties
   * @returns {Promise<string>}
   */
  async triggerAnalyticsEvent(eventName, properties = null) {
    if (Platform.OS !== 'android' || !SCLoansBridgeEmitter || !SCLoansBridgeEmitter.triggerAnalyticsEvent) {
      console.warn('SCLoansEventManager: Analytics event triggering only available on Android');
      return Promise.resolve('Not available on this platform');
    }

    try {
      const result = await SCLoansBridgeEmitter.triggerAnalyticsEvent(eventName, properties);
      console.log(`SCLoansEventManager: Analytics event triggered successfully: ${eventName}`);
      return result;
    } catch (error) {
      console.error('SCLoansEventManager: Failed to trigger analytics event:', error);
      throw error;
    }
  }

  /**
   * Trigger super properties update (Android only)
   * @param {object} properties - Super properties
   * @returns {Promise<string>}
   */
  async triggerSuperPropertiesUpdate(properties = null) {
    if (Platform.OS !== 'android' || !SCLoansBridgeEmitter || !SCLoansBridgeEmitter.triggerSuperPropertiesUpdate) {
      console.warn('SCLoansEventManager: Super properties update only available on Android');
      return Promise.resolve('Not available on this platform');
    }

    try {
      const result = await SCLoansBridgeEmitter.triggerSuperPropertiesUpdate(properties);
      console.log('SCLoansEventManager: Super properties update triggered successfully');
      return result;
    } catch (error) {
      console.error('SCLoansEventManager: Failed to trigger super properties update:', error);
      throw error;
    }
  }

  /**
   * Get supported events (Android only)
   * @returns {Promise<Array>}
   */
  async getSupportedEvents() {
    if (Platform.OS !== 'android' || !SCLoansBridgeEmitter || !SCLoansBridgeEmitter.getSupportedEvents) {
      // Return default events for iOS or if method not available
      return Promise.resolve([SCLoansEventTypes.NOTIFICATION]);
    }

    try {
      const events = await SCLoansBridgeEmitter.getSupportedEvents();
      console.log('SCLoansEventManager: Retrieved supported events:', events);
      return events;
    } catch (error) {
      console.error('SCLoansEventManager: Failed to get supported events:', error);
      throw error;
    }
  }

  // Private helper methods
  removeListenerFromMap(eventType, targetSubscription) {
    console.log(`SCLoansEventManager: Removing iOS listener from map for event type: ${eventType}`);
    const subscriptions = this.listeners.get(eventType) || [];
    const index = subscriptions.indexOf(targetSubscription);
    if (index > -1) {
      subscriptions.splice(index, 1);
      if (subscriptions.length === 0) {
        this.listeners.delete(eventType);
        console.log(`SCLoansEventManager: No more iOS listeners for ${eventType}, removing event type from map.`);
      }
    }
  }

  removeAndroidListenerFromMap(eventType, targetSubscription) {
    console.log(`SCLoansEventManager: Removing Android listener from map for event type: ${eventType}`);
    const subscriptions = this.androidListeners.get(eventType) || [];
    const index = subscriptions.indexOf(targetSubscription);
    if (index > -1) {
      subscriptions.splice(index, 1);
      if (subscriptions.length === 0) {
        this.androidListeners.delete(eventType);
        console.log(`SCLoansEventManager: No more Android listeners for ${eventType}, removing event type from map.`);
      }
    }
  }
}

// Create and export singleton instance
const scLoansEventManager = new SCLoansEventManager();

export default scLoansEventManager;

/**
 * Convenience methods for common use cases
 */
export const SCLoansEvents = {
  /**
   * Listen to notification events (iOS) or analytics events (Android)
   * @param {function} callback - Function to handle events
   * @returns {object} - Subscription object
   */
  onAnalyticsEvent: (callback) => {
    const eventType = Platform.OS === 'ios' 
      ? SCLoansEventTypes.NOTIFICATION 
      : SCLoansEventTypes.ANALYTICS_EVENT;
    
    return scLoansEventManager.addEventListener(eventType, callback);
  },

  /**
   * Listen to super properties updated events (Android only)
   * @param {function} callback - Function to handle events
   * @returns {object} - Subscription object
   */
  onSuperPropertiesUpdated: (callback) => {
    if (Platform.OS !== 'android') {
      console.warn('SCLoansEvents: Super properties events only available on Android');
      return { remove: () => {} };
    }
    return scLoansEventManager.addEventListener(SCLoansEventTypes.SUPER_PROPERTIES_UPDATED, callback);
  },

  /**
   * Listen to user reset events (Android only)
   * @param {function} callback - Function to handle events
   * @returns {object} - Subscription object
   */
  onUserReset: (callback) => {
    if (Platform.OS !== 'android') {
      console.warn('SCLoansEvents: User reset events only available on Android');
      return { remove: () => {} };
    }
    return scLoansEventManager.addEventListener(SCLoansEventTypes.USER_RESET, callback);
  },

  /**
   * Listen to user identify events (Android only)
   * @param {function} callback - Function to handle events
   * @returns {object} - Subscription object
   */
  onUserIdentify: (callback) => {
    if (Platform.OS !== 'android') {
      console.warn('SCLoansEvents: User identify events only available on Android');
      return { remove: () => {} };
    }
    return scLoansEventManager.addEventListener(SCLoansEventTypes.USER_IDENTIFY, callback);
  },

  /**
   * Start listening to all events
   */
  startListening: () => scLoansEventManager.startListening(),

  /**
   * Stop listening to all events
   */
  stopListening: () => scLoansEventManager.stopListening(),

  /**
   * Get debug information
   */
  getDebugInfo: () => scLoansEventManager.getDebugInfo(),

  /**
   * Get listening status (async)
   */
  getListeningStatus: () => scLoansEventManager.getListeningStatus(),

  /**
   * Get listening status (sync)
   */
  getListeningStatusSync: () => scLoansEventManager.getListeningStatusSync(),

  /**
   * Remove all event listeners
   */
  removeAllListeners: () => scLoansEventManager.removeAllListeners(),

  /**
   * Get supported events (Android only)
   */
  getSupportedEvents: () => scLoansEventManager.getSupportedEvents(),

  // Android-specific testing methods
  /**
   * Emit test event (Android only)
   */
  emitTestEvent: (eventType, testData) => scLoansEventManager.emitTestEvent(eventType, testData),

  /**
   * Trigger analytics event (Android only)
   */
  triggerAnalyticsEvent: (eventName, properties) => scLoansEventManager.triggerAnalyticsEvent(eventName, properties),

  /**
   * Trigger super properties update (Android only)
   */
  triggerSuperPropertiesUpdate: (properties) => scLoansEventManager.triggerSuperPropertiesUpdate(properties),
};