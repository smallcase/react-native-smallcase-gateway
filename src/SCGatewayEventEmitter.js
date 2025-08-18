import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { SCGatewayBridgeEmitter } = NativeModules;
// would be removed
// Create event emitter instance
let eventEmitter = null;
if (Platform.OS === 'ios' && SCGatewayBridgeEmitter) {
  eventEmitter = new NativeEventEmitter(SCGatewayBridgeEmitter);
}

/**
 * SCGateway Event Types
 */
export const SCGatewayEventTypes = {
  ANALYTICS_EVENT: 'scgateway_analytics_event',
  SUPER_PROPERTIES_UPDATED: 'scgateway_super_properties_updated',
  USER_RESET: 'scgateway_user_reset',
  USER_IDENTIFY: 'scgateway_user_identify',
};

/**
 * SCGateway Event Manager
 * Provides methods to listen to analytics events from the native iOS SDK
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
    if (Platform.OS !== 'ios' || !SCGatewayBridgeEmitter) {
      console.warn('SCGatewayEventManager: Not available on this platform');
      return Promise.resolve('Not available');
    }

    console.log('SCGatewayEventManager: Attempting to start listening...');
    try {
      const result = await SCGatewayBridgeEmitter.startListening();
      this.isListening = true;
      console.log('SCGatewayEventManager: Started listening successfully:', result);
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
    if (Platform.OS !== 'ios' || !SCGatewayBridgeEmitter) {
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
   * Add listener for a specific event type
   * @param {string} eventType - Event type from SCGatewayEventTypes
   * @param {function} callback - Callback function to handle the event
   * @returns {object} - Subscription object with remove() method
   */
  addEventListener(eventType, callback) {
    console.log(`SCGatewayEventManager: Attempting to add listener for event type: ${eventType}`);
    if (Platform.OS !== 'ios' || !eventEmitter) {
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

    const subscription = eventEmitter.addListener(eventType, callback);
    
    // return subs from here directly
    // Store subscription for cleanup
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(subscription);

    console.log(`SCGatewayEventManager: Successfully added listener for ${eventType}`);

    return { // return subs from here directly then the host appln will remove it itself
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
    if (Platform.OS !== 'ios' || !eventEmitter) {
      console.warn('SCGatewayEventManager: Event emitter not available on this platform, cannot remove listener.');
      return;
    }

    eventEmitter.removeListener(eventType, callback);
    console.log(`SCGatewayEventManager: Successfully removed listener for ${eventType}`);
  }

  /**
   * Remove all listeners for a specific event type
   * @param {string} eventType - Event type from SCGatewayEventTypes
   */
  removeAllListeners(eventType = null) {
    console.log(`SCGatewayEventManager: Attempting to remove all listeners for event type: ${eventType || 'all'}`);
    if (Platform.OS !== 'ios' || !eventEmitter) {
      console.warn('SCGatewayEventManager: Event emitter not available on this platform, cannot remove all listeners.');
      return;
    }

    if (eventType) {
      // there should be only single listener for 1 single event i.e. declared in SCGatewayEmitter.swift
      // Remove listeners for specific event type
      const subscriptions = this.listeners.get(eventType) || [];
      subscriptions.forEach(subscription => subscription.remove());
      this.listeners.delete(eventType);
      
      eventEmitter.removeAllListeners(eventType);
      console.log(`SCGatewayEventManager: Successfully removed all listeners for ${eventType}`);
    } else {
      // Remove all listeners
      this.listeners.forEach((subscriptions, type) => {
        subscriptions.forEach(subscription => subscription.remove());
        eventEmitter.removeAllListeners(type);
      });
      this.listeners.clear();
      
      console.log('SCGatewayEventManager: Successfully removed all listeners');
    }
  }

  /**
   * Get current listening status
   * @returns {boolean}
   */
  getListeningStatus() {
    return this.isListening;
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

// Create and export singleton instance
const scGatewayEventManager = new SCGatewayEventManager();

export default scGatewayEventManager;

/**
 * Convenience methods for common use cases
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
};