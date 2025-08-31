// SCLoansEventEmitter.js - Unified Cross-Platform Loans Event System  

import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

// Gateway Event Types (as per native iOS + Android emitters)
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
      
      if (nativeModule) {
        this.eventEmitter = new NativeEventEmitter(nativeModule);
        this.isInitialized = true;
        console.log('[SCLoansEvents] Initialized for', Platform.OS);
      } else {
        console.warn('[SCLoansEvents] Native module not found for', Platform.OS);
      }
    } catch (error) {
      console.error('[SCLoansEvents] Initialization failed:', error);
    }
  }

  subscribe(callback) {
    if (!this.isInitialized || !this.eventEmitter) {
      console.warn('[SCLoansEvents] Event emitter not initialized');
      return null;
    }

    try {
      const subscription = this.eventEmitter.addListener('scloans_notification', (eventData) => {
        console.log('[SCLoansEvents] Raw event received:', eventData);
        
        if (!eventData) {
          console.warn('[SCLoansEvents] Received null/undefined event data');
          return;
        }

        const normalizedEvent = {
          type: eventData.eventType || eventData.type || 'unknown_event',
          eventType: eventData.eventType || eventData.type || 'unknown_event',
          data: eventData.data || eventData,
          timestamp: eventData.timestamp || Date.now(),
          ...eventData
        };

        console.log('[SCLoansEvents] Normalized event:', normalizedEvent);
        callback(normalizedEvent);
      });

      this.subscriptions.push(subscription);
      
      console.log('SCLoansEvents Subscribed to gateway events');
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
        
        const index = this.subscriptions.indexOf(subscription);
        if (index > -1) {
          this.subscriptions.splice(index, 1);
        }
        
        console.log('SCLoansEvents Unsubscribed from event');
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
      console.log('[SCLoansEvents] All listeners cleaned up');
    } catch (error) {
      console.error('[SCLoansEvents] Cleanup error:', error);
    }
  }
}

const scLoansEventManager = new SCLoansEvents();

export default scLoansEventManager;

export { scLoansEventManager };