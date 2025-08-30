// 📡 SCGatewayEventEmitter.js - Unified Cross-Platform Gateway Event System
// 🔄 Single file for both Android & iOS - Analytics/User Events Only

import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

// 🎯 Gateway Event Types (as per native iOS + Android emitters)
export const SCGatewayEventTypes = {
  ANALYTICS_EVENT: 'scgateway_analytics_event',
  SUPER_PROPERTIES_UPDATED: 'scgateway_super_properties_updated',
  USER_RESET: 'scgateway_user_reset',
  USER_IDENTIFY: 'scgateway_user_identify',
};

// 🎯 Gateway Events Class
export class SCGatewayEvents {
  constructor() {
    this.eventEmitter = null;
    this.listeners = new Map();
    this.subscriptions = []; // Track all subscriptions for cleanup
    this.isInitialized = false;

    this.initialize();
  }

  initialize() {
    try {
      const nativeModule = NativeModules.SCGatewayBridgeEmitter;

      if (nativeModule) {
        this.eventEmitter = new NativeEventEmitter(nativeModule);
        this.isInitialized = true;
        console.log('[SCGatewayEvents] ✅ Initialized for', Platform.OS);
      } else {
        console.warn('[SCGatewayEvents] ⚠️ Native module not found for', Platform.OS);
      }
    } catch (error) {
      console.error('[SCGatewayEvents] ❌ Initialization failed:', error);
    }
  }

  // 🎧 Subscribe to Gateway Events - Single listener for all events
  subscribe(callback) {
    if (!this.isInitialized || !this.eventEmitter) {
      console.warn('[SCGatewayEvents] ⚠️ Event emitter not initialized');
      return null;
    }

    try {
      // Listen to the unified event channel
      const subscription = this.eventEmitter.addListener("scg_notification", (eventData) => {
        console.log('[SCGatewayEvents] 📥 Raw event received:', eventData);
        
        // Ensure eventData has required properties
        if (!eventData) {
          console.warn('[SCGatewayEvents] ⚠️ Received null/undefined event data');
          return;
        }

        // Normalize the event data structure
        const normalizedEvent = {
          type: eventData.eventType || eventData.type || 'unknown_event',
          eventType: eventData.eventType || eventData.type || 'unknown_event',
          data: eventData.data || eventData,
          timestamp: eventData.timestamp || Date.now(),
          ...eventData // Spread original data
        };

        console.log('[SCGatewayEvents] 📤 Normalized event:', normalizedEvent);
        callback(normalizedEvent);
      });

      // Store subscription for cleanup
      this.subscriptions.push(subscription);
      
      console.log('[SCGatewayEvents] 🎧 Subscribed to gateway events');
      return subscription;
    } catch (error) {
      console.error('[SCGatewayEvents] ❌ Subscription failed:', error);
      return null;
    }
  }

  // 🔕 Unsubscribe from specific event
  unsubscribe(subscription) {
    if (subscription && typeof subscription.remove === 'function') {
      try {
        subscription.remove();
        
        // Remove from tracked subscriptions
        const index = this.subscriptions.indexOf(subscription);
        if (index > -1) {
          this.subscriptions.splice(index, 1);
        }
        
        console.log('[SCGatewayEvents] 🔕 Unsubscribed from event');
      } catch (error) {
        console.error('[SCGatewayEvents] ❌ Unsubscribe error:', error);
      }
    }
  }

  // 🧹 Clean up all listeners
  cleanup() {
    try {
      this.subscriptions.forEach(subscription => {
        if (subscription && typeof subscription.remove === 'function') {
          subscription.remove();
        }
      });

      this.subscriptions = [];
      this.listeners.clear();
      console.log('[SCGatewayEvents] ✅ All listeners cleaned up');
    } catch (error) {
      console.error('[SCGatewayEvents] ❌ Cleanup error:', error);
    }
  }

  // 🎯 Stop listening (alias for cleanup)
  stopListening() {
    this.cleanup();
  }

  // 🎯 Convenience Methods for specific event types
  onAnalyticsEvent(callback) {
    return this.subscribe((eventData) => {
      if (eventData.eventType === SCGatewayEventTypes.ANALYTICS_EVENT || 
          eventData.eventType === 'scg_analytics_event') {
        callback(eventData);
      }
    });
  }

  onSuperPropertiesUpdated(callback) {
    return this.subscribe((eventData) => {
      if (eventData.eventType === SCGatewayEventTypes.SUPER_PROPERTIES_UPDATED || 
          eventData.eventType === 'scg_analytics_super_props') {
        callback(eventData);
      }
    });
  }

  onUserReset(callback) {
    return this.subscribe((eventData) => {
      if (eventData.eventType === SCGatewayEventTypes.USER_RESET || 
          eventData.eventType === 'scg_user_reset') {
        callback(eventData);
      }
    });
  }

  onUserIdentify(callback) {
    return this.subscribe((eventData) => {
      if (eventData.eventType === SCGatewayEventTypes.USER_IDENTIFY || 
          eventData.eventType === 'scg_user_identify') {
        callback(eventData);
      }
    });
  }
}

// 🎯 Export Singleton Instance
const scGatewayEventManager = new SCGatewayEvents();

// 🔄 Default export for backward compatibility
export default scGatewayEventManager;

// 🎯 Named export for explicit usage
export { scGatewayEventManager };