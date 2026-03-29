import { NativeEventEmitter, NativeModules } from 'react-native';

/**
 * @typedef {Object} GatewayEvent
 * @property {string} type - Event type
 * @property {any} data - Event payload data
 * @property {number} timestamp - Event timestamp
 *
 * @typedef {Object} GatewayEventSubscription
 * @property {() => void} remove - Method to unsubscribe from gateway events
 *
 */

const nativeModule = NativeModules.SCGatewayBridgeEmitter;

export const SCGatewayEventTypes = {
  ANALYTICS_EVENT: 'scgateway_analytics_event',
  SUPER_PROPERTIES_UPDATED: 'scgateway_super_properties_updated',
  USER_RESET: 'scgateway_user_reset',
  USER_IDENTIFY: 'scgateway_user_identify',
  SMALLPLUG_ANALYTICS_EVENT: 'smallplug_analytics_event',
};

const SCGatewayNotificationEvent = 'scg_notification';

class SCGatewayEvents {
  constructor() {
    this.eventEmitter = null;
    this.subscriptions = [];
    this.initialize();
  }

  get isInitialized() {
    return this.eventEmitter !== null;
  }

  initialize() {
    if (nativeModule) {
      this.eventEmitter = new NativeEventEmitter(nativeModule);
    } else {
      console.warn('[SCGatewayEvents] Native module not available');
    }
  }

  // ===== GATEWAY EVENT METHODS =====
  /**
   * Subscribe to Gateway Events
   * @param {(event: GatewayEvent) => void} callback - Callback function to handle gateway events
   * @returns {GatewayEventSubscription} subscription - Subscription object with remove() method
   */
  subscribeToGatewayEvents(callback) {
    if (!this.isInitialized) {
      console.warn('[SCGatewayEvents] Event emitter not initialized');
      return null;
    }

    if (typeof callback !== 'function') {
      console.warn(
        '[SCGatewayEvents] Invalid callback provided for subscription'
      );
      return null;
    }

    const subscription = this.eventEmitter.addListener(
      SCGatewayNotificationEvent,
      (jsonString) => {
        if (!jsonString) {
          console.warn('[SCGatewayEvents] Received null/undefined event data');
          return;
        }

        let eventData;
        try {
          eventData = JSON.parse(jsonString);
        } catch (error) {
          console.warn(
            '[SCGatewayEvents] Failed to parse event JSON:',
            error,
            'Raw data:',
            jsonString
          );
          return;
        }

        if (!eventData.type) {
          console.warn(
            '[SCGatewayEvents] Dropping event - missing event type:',
            eventData
          );
          return;
        }

        const normalizedEvent = {
          type: eventData.type,
          data: eventData.data,
          timestamp: eventData.timestamp || Date.now(),
        };

        callback(normalizedEvent);
      }
    );

    this.subscriptions.push(subscription);

    return subscription;
  }

  /**
   * Subscribe to SmallPlug / DM analytics events streamed during a launchSmallplug session.
   * Events have shape: { eventName: string, data: object, timestamp: number }
   * @param {(event: {eventName: string, data: any, timestamp: number}) => void} callback
   * @returns {GatewayEventSubscription}
   */
  subscribeToSmallplugEvents(callback) {
    if (!this.isInitialized) {
      console.warn('[SCGatewayEvents] Event emitter not initialized');
      return null;
    }

    if (typeof callback !== 'function') {
      console.warn('[SCGatewayEvents] Invalid callback provided for SmallPlug subscription');
      return null;
    }

    const subscription = this.eventEmitter.addListener(
      SCGatewayNotificationEvent,
      (jsonString) => {
        if (!jsonString) return;
        let parsed;
        try {
          parsed = JSON.parse(jsonString);
        } catch (e) {
          return;
        }
        if (parsed.type !== 'smallplug_analytics_event') return;
        const { eventName, data } = parsed.data ?? {};
        callback({ eventName, data, timestamp: parsed.timestamp ?? Date.now() });
      }
    );

    this.subscriptions.push(subscription);
    return subscription;
  }

  /**
   * Unsubscribe from SmallPlug analytics events
   * @param {GatewayEventSubscription} subscription - Subscription returned from subscribeToSmallplugEvents
   */
  unsubscribeFromSmallplugEvents(subscription) {
    if (subscription && typeof subscription.remove === 'function') {
      subscription.remove();
      this.subscriptions = this.subscriptions.filter(
        (sub) => sub !== subscription
      );
    }
  }

  /**
   * Unsubscribe from Gateway Events
   * @param {GatewayEventSubscription} subscription - Subscription returned from subscribeToGatewayEvents
   */
  unsubscribeFromGatewayEvents(subscription) {
    if (subscription && typeof subscription.remove === 'function') {
      subscription.remove();
      this.subscriptions = this.subscriptions.filter(
        (sub) => sub !== subscription
      );
    }
  }

  cleanup() {
    this.subscriptions.forEach((subscription) => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    });
    this.subscriptions = [];
  }
}

const scGatewayEventManager = new SCGatewayEvents();

export default scGatewayEventManager;
