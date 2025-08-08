import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { SCLoansBridgeEmitter } = NativeModules;

// Create event emitter instance
let eventEmitter = null;
if (Platform.OS === 'ios' && SCLoansBridgeEmitter) {
  eventEmitter = new NativeEventEmitter(SCLoansBridgeEmitter);
}

/**
 * SCLoans Event Types
 */
export const SCLoansEventTypes = {
  NOTIFICATION: 'scloans_notification',
};

/**
 * SCLoans Event Manager
 * Provides methods to listen to analytics events from the native iOS SDK
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
    if (Platform.OS !== 'ios' || !SCLoansBridgeEmitter) {
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
    if (Platform.OS !== 'ios' || !SCLoansBridgeEmitter) {
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
    if (Platform.OS !== 'ios' || !SCLoansBridgeEmitter) {
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
   * Add listener for a specific event type
   * @param {string} eventType - Event type from SCLoansEventTypes
   * @param {function} callback - Callback function to handle the event
   * @returns {object} - Subscription object with remove() method
   */
  addEventListener(eventType, callback) {
    console.log(`SCLoansEventManager: Attempting to add listener for event type: ${eventType}`);
    if (Platform.OS !== 'ios' || !eventEmitter) {
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

    // Always listen to 'scloans_notification' but handle different event types in the callback
    const wrappedCallback = (data) => {
      // The data should contain a 'type' field to identify the actual event type
      console.log(`SCLoansEventManager: Received notification with data:`, data);
      callback(data);
    };

    const subscription = eventEmitter.addListener(SCLoansEventTypes.NOTIFICATION, wrappedCallback);
    
    // Store subscription for cleanup
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(subscription);

    console.log(`SCLoansEventManager: Successfully added listener for ${eventType} (listening to scloans_notification)`);

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
    if (Platform.OS !== 'ios' || !eventEmitter) {
      console.warn('SCLoansEventManager: Event emitter not available on this platform, cannot remove listener.');
      return;
    }

    eventEmitter.removeListener(eventType, callback);
    console.log(`SCLoansEventManager: Successfully removed listener for ${eventType}`);
  }

  /**
   * Remove all listeners for a specific event type
   * @param {string} eventType - Event type from SCLoansEventTypes
   */
  removeAllListeners(eventType = null) {
    console.log(`SCLoansEventManager: Attempting to remove all listeners for event type: ${eventType || 'all'}`);
    if (Platform.OS !== 'ios' || !eventEmitter) {
      console.warn('SCLoansEventManager: Event emitter not available on this platform, cannot remove all listeners.');
      return;
    }

    if (eventType) {
      // Remove listeners for specific event type
      const subscriptions = this.listeners.get(eventType) || [];
      subscriptions.forEach(subscription => subscription.remove());
      this.listeners.delete(eventType);
      
      eventEmitter.removeAllListeners(eventType);
      console.log(`SCLoansEventManager: Successfully removed all listeners for ${eventType}`);
    } else {
      // Remove all listeners
      this.listeners.forEach((subscriptions, type) => {
        subscriptions.forEach(subscription => subscription.remove());
        eventEmitter.removeAllListeners(type);
      });
      this.listeners.clear();
      
      console.log('SCLoansEventManager: Successfully removed all listeners');
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

// Create and export singleton instance
const scLoansEventManager = new SCLoansEventManager();

export default scLoansEventManager;

/**
 * Convenience methods for common use cases
 */
export const SCLoansEvents = {
  /**
   * Listen to all notification events (will receive events with different types in the data)
   * @param {function} callback - Function to handle notification events
   * @returns {object} - Subscription object
   */
  onAnalyticsEvent: (callback) => {
    return scLoansEventManager.addEventListener(
      SCLoansEventTypes.NOTIFICATION,
      callback
    );
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
   * Remove all event listeners
   */
  removeAllListeners: () => scLoansEventManager.removeAllListeners(),
};