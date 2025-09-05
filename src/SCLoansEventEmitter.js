// SCLoansEventEmitter.js - Unified Cross-Platform Loans Event System  

import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const EVENT_CHANNELS = {
  SCLOANS_NOTIFICATION: 'scloans_notification',
};

export const SCLoansEventTypes = {
  ANALYTICS_EVENT: 'scloans_analytics_event',
  SUPER_PROPERTIES_UPDATED: 'scloans_super_properties_updated',
  USER_RESET: 'scloans_user_reset',
  USER_IDENTIFY: 'scloans_user_identify',
};

export class SCLoansEvents {
  constructor() {
    this.eventEmitter = null;
    this.listeners = new Map();
    this.subscriptions = [];
    this.isInitialized = false;

    this.initialize();
  }

  initialize() {
    try {
        const nativeModule = NativeModules.SCLoansBridgeEmitter;
      
      if (!nativeModule) {
        throw new Error(`Native module SCLoansBridgeEmitter not found for ${Platform.OS}. Make sure the native SDK is properly installed and linked.`);
      }
      
      this.eventEmitter = new NativeEventEmitter(nativeModule);
      this.isInitialized = true;
    } catch (error) {
      console.error('[SCLoansEvents] Initialization failed:', error);
      throw new Error(`SCLoansEvents initialization failed: ${error.message}`);
    }
  }

  subscribe(callback) {
  if (!this.isInitialized || !this.eventEmitter) {
    console.warn('[SCLoansEvents] Event emitter not initialized');
    return null;
  }

    try {
      const subscription = this.eventEmitter.addListener(EVENT_CHANNELS.SCLOANS_NOTIFICATION, (eventData) => {
        if (!eventData) {
          console.warn('[SCLoansEvents] Received null/undefined event data');
          return;
        }

        if (!eventData.type) {
          console.warn('[SCLoansEvents] Dropping event - missing event type:', eventData);
          return;
        }

        const normalizedEvent = {
          type: eventData.type,
          data: eventData.data,
          timestamp: eventData.timestamp || Date.now()
        };
        callback(normalizedEvent);
      });

      this.subscriptions.push(subscription);
      
      return subscription;
    } catch (error) {
      console.error('SCLoansEvents Subscription failed:', error);
      return null;
    }
  }

  unsubscribe(subscription) {
    if (subscription && typeof subscription.remove === 'function') {
      try {
        subscription.remove();
      
        this.subscriptions = this.subscriptions.filter(sub => sub !== subscription);
      } catch (error) {
        console.error('SCLoansEvents Unsubscribe error:', error);
      }
    }
  }

  cleanup() {
    try {
      this.subscriptions.forEach(subscription => {
        if (subscription && typeof subscription.remove === 'function') {
          subscription.remove();
        }
      });

      this.subscriptions = [];
      this.listeners.clear();
    } catch (error) {
      console.error('[SCLoansEvents] Cleanup error:', error);
    }
  }

  hasNoActiveSubscriptions() {
    return this.subscriptions.length === 0;
  }

  stopListening() {
    this.cleanup();
  }
}

const scLoansEventManager = new SCLoansEvents();

export default scLoansEventManager;

export { scLoansEventManager };