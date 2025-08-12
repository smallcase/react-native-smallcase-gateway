// 📡 SCGatewayEventManager.android.js - Android Event Bridge for React Native
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { SCGatewayBridgeEmitter } = NativeModules;

// Module load diagnostics
console.log('[SCGatewayEventManager.android] Module loaded');
console.log('[SCGatewayEventManager.android] Platform:', Platform.OS);
console.log('[SCGatewayEventManager.android] Has SCGatewayBridgeEmitter:', !!SCGatewayBridgeEmitter);

// Create event emitter instance for Android
let eventEmitter = null;
if (Platform.OS === 'android' && SCGatewayBridgeEmitter) {
  try {
    eventEmitter = new NativeEventEmitter(SCGatewayBridgeEmitter);
    console.log('[SCGatewayEventManager.android] NativeEventEmitter created for SCGatewayBridgeEmitter');
  } catch (e) {
    console.warn('[SCGatewayEventManager.android] Failed to create NativeEventEmitter:', e);
  }
} else {
  console.warn('[SCGatewayEventManager.android] Event emitter not created. Conditions not met.');
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
    if (Platform.OS !== 'android' || !eventEmitter) {
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

    const subscription = eventEmitter.addListener(eventType, wrappedCallback);
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
    if (Platform.OS !== 'android' || !eventEmitter) {
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
    if (Platform.OS !== 'android' || !eventEmitter) {
      console.warn('SCGatewayEventManager: Event emitter not available on this platform, cannot remove all listeners.');
      return;
    }

    if (eventType) {
      // Remove listeners for specific event type
      const subscriptions = this.listeners.get(eventType) || [];
      console.log(`[SCGatewayEventManager.android] Removing ${subscriptions.length} listener(s) for '${eventType}'`);
      subscriptions.forEach(subscription => subscription.remove());
      this.listeners.delete(eventType);
      
      eventEmitter.removeAllListeners(eventType);
      console.log(`SCGatewayEventManager: Successfully removed all listeners for ${eventType}`);
    } else {
      // Remove all listeners
      this.listeners.forEach((subscriptions, type) => {
        console.log(`[SCGatewayEventManager.android] Removing ${subscriptions.length} listener(s) for '${type}'`);
        subscriptions.forEach(subscription => subscription.remove());
        eventEmitter.removeAllListeners(type);
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

  /**
   * Get current status
   */
  getStatus: () => scGatewayEventManager.getListeningStatus(),

  /**
   * Emit test event (for debugging)
   */
  emitTestEvent: (eventType, testData) => scGatewayEventManager.emitTestEvent(eventType, testData),
};