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
    this.subscriptions = [];
    this.initialize();
  }

  get isInitialized() {
    return this.eventEmitter !== null;
  }

  initialize() {
    const nativeModule = NativeModules.SCGatewayBridgeEmitter;
    this.eventEmitter = new NativeEventEmitter(nativeModule);
  }

  subscribe(callback) {
    if (!this.isInitialized) {
      console.warn('[SCGatewayEvents] Event emitter not initialized');
      return null;
    }

    if (typeof callback !== 'function') {
      console.warn('[SCGatewayEvents] Invalid callback provided for subscription');
      return null;
    }

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