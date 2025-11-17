import {
    NativeEventEmitter,
    NativeModules,
    Platform
} from 'react-native';

/**
 * @typedef {Object} LoansEvent
 * @property {string} type - Event type
 * @property {number} timestamp - Event timestamp
 *
 * @typedef {Object} LoansEventSubscription
 * @property {() => void} remove - Method to unsubscribe from loans events
 */

const nativeModule = NativeModules.SCLoansBridgeEmitter;

export const SCLoansEventTypes = {
    ANALYTICS_EVENT: 'scloans_analytics_event',
    SUPER_PROPERTIES_UPDATED: 'scloans_super_properties_updated',
};

const SCLoansNotificationEvent = 'scloans_notification';
class SCLoansEvents {
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
            console.warn('[SCLoansEvents] Native module not available');
        }
    }

    // ===== LOANS EVENT METHODS =====
    /**
     * Subscribe to Loans Events
     * @param {(event: LoansEvent) => void} callback - Callback function to handle loans events
     * @returns {LoansEventSubscription} subscription - Subscription object with remove() method
     */
    subscribeToLoansEvent(callback) {
        if (!this.isInitialized) {
            console.warn('[SCLoansEvents] Event emitter not initialized');
            return null;
        }

        if (typeof callback !== 'function') {
            console.warn('[SCLoansEvents] Invalid callback provided for subscription');
            return null;
        }

        const subscription = this.eventEmitter.addListener(SCLoansNotificationEvent, (jsonString) => {
            if (!jsonString) {
                console.warn('[SCLoansEvents] Received null/undefined event data');
                return;
            }

            let eventData;
            try {
                eventData = JSON.parse(jsonString);
            } catch (error) {
                console.warn('[SCLoansEvents] Failed to parse event JSON:', error, 'Raw data:', jsonString);
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
    }

    /**
     * Unsubscribe from Loans Events
     * @param {LoansEventSubscription} subscription - Subscription returned from subscribeToLoansEvents
     */
    unsubscribeFromLoansEvent(subscription) {
        if (subscription && typeof subscription.remove === 'function') {
            subscription.remove();
            this.subscriptions = this.subscriptions.filter(sub => sub !== subscription);
        }
    }

    cleanup() {
        this.subscriptions.forEach(subscription => {
            if (subscription && typeof subscription.remove === 'function') {
                subscription.remove();
            }
        });
        this.subscriptions = [];
    }
}

const scLoansEventManager = new SCLoansEvents();

export default scLoansEventManager;