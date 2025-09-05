// SCGatewayEventEmitter.js - Unified Cross-Platform Gateway Event System

import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

const EVENT_CHANNELS = {
  SCG_NOTIFICATION: 'scg_notification',
};

export const SCGatewayEventTypes = {
  ANALYTICS_EVENT: 'scgateway_analytics_event',
  SUPER_PROPERTIES_UPDATED: 'scgateway_super_properties_updated',
  USER_RESET: 'scgateway_user_reset',
  USER_IDENTIFY: 'scgateway_user_identify',
};

export class SCGatewayEvents {
  constructor() {
    this.eventEmitter = null;
    this.listeners = new Map();
    this.subscriptions = [];
    this.isInitialized = false;

    this.initialize();
  }

  initialize() {
    try {
      const nativeModule = NativeModules.SCGatewayBridgeEmitter;
      
      if (!nativeModule) {
        throw new Error(`Native module 'SCGatewayBridgeEmitter' not found for ${Platform.OS}. Make sure the native SDK is properly installed and linked.`);
      }
      
      this.eventEmitter = new NativeEventEmitter(nativeModule);
      this.isInitialized = true;
    } catch (error) {
      console.error('[SCGatewayEvents] Initialization failed:', error);
      throw new Error(`SCGatewayEvents initialization failed: ${error.message}`);
    }
  }

  subscribe(callback) {
    if (!this.isInitialized || !this.eventEmitter) {
      console.warn('[SCGatewayEvents] Event emitter not initialized');
      return null;
    }

    try {
      const subscription = this.eventEmitter.addListener(EVENT_CHANNELS.SCG_NOTIFICATION, (eventData) => {
        if (!eventData) {
          console.warn('[SCGatewayEvents] Received null/undefined event data');
          return;
        }

        if (!eventData.type) {
          console.warn('[SCGatewayEvents] Dropping event - missing event type:', eventData);
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
      console.error('[SCGatewayEvents] Subscription failed:', error);
      return null;
    }
  }

  unsubscribe(subscription) {
    if (subscription && typeof subscription.remove === 'function') {
      try {
        subscription.remove();
        
        // Use filter instead of indexOf + splice
        this.subscriptions = this.subscriptions.filter(sub => sub !== subscription);
      } catch (error) {
        console.error('[SCGatewayEvents] Unsubscribe error:', error);
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
      console.error('[SCGatewayEvents] Cleanup error:', error);
    }
  }

  hasNoActiveSubscriptions() {
    return this.subscriptions.length === 0;
  }

  stopListening() {
    this.cleanup();
  }
}

const scGatewayEventManager = new SCGatewayEvents();

export default scGatewayEventManager;

export { scGatewayEventManager };