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
        console.log('[SCGatewayEvents] Initialized for', Platform.OS);
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
        console.log('[SCGatewayEvents] Raw event received:', eventData);
        
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

        console.log('[SCGatewayEvents] Normalized event:', normalizedEvent);
        callback(normalizedEvent);
      });

      this.subscriptions.push(subscription);
      
      console.log('[SCGatewayEvents] Subscribed to gateway events');
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
        
        console.log('[SCGatewayEvents] Unsubscribed from event');
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
      console.log('[SCGatewayEvents] All listeners cleaned up');
    } catch (error) {
      console.error('[SCGatewayEvents] Cleanup error:', error);
    }
  }

  stopListening() {
    this.cleanup();
  }
}

const scGatewayEventManager = new SCGatewayEvents();

export default scGatewayEventManager;

export { scGatewayEventManager };