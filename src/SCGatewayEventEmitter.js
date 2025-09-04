// SCGatewayEventEmitter.js - Unified Cross-Platform Gateway Event System

import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

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

      if (nativeModule) {
        this.eventEmitter = new NativeEventEmitter(nativeModule);
        this.isInitialized = true;
      } else {
        console.warn('[SCGatewayEvents] Native module not found for', Platform.OS);
      }
    } catch (error) {
      console.error('[SCGatewayEvents] Initialization failed:', error);
    }
  }

  subscribe(callback) {
    if (!this.isInitialized || !this.eventEmitter) {
      console.warn('[SCGatewayEvents] Event emitter not initialized');
      return null;
    }

    try {
      const subscription = this.eventEmitter.addListener("scg_notification", (eventData) => {
        if (!eventData) {
          console.warn('[SCGatewayEvents] Received null/undefined event data');
          return;
        }

        const normalizedEvent = {
          type: eventData.eventType || eventData.type || 'unknown_event',
          eventType: eventData.eventType || eventData.type || 'unknown_event',
          data: eventData.data || eventData,
          timestamp: eventData.timestamp || Date.now(),
          ...eventData 
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
        
        const index = this.subscriptions.indexOf(subscription);
        if (index > -1) {
          this.subscriptions.splice(index, 1);
        }
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