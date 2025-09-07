import {
	NativeEventEmitter,
	NativeModules,
	Platform
} from 'react-native';

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
	ANALYTICS_EVENT: nativeModule?.ANALYTICS_EVENT || 'scgateway_analytics_event',
	SUPER_PROPERTIES_UPDATED: nativeModule?.SUPER_PROPERTIES_UPDATED || 'scgateway_super_properties_updated',
	USER_RESET: nativeModule?.USER_RESET || 'scgateway_user_reset',
	USER_IDENTIFY: nativeModule?.USER_IDENTIFY || 'scgateway_user_identify',
};

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
			console.warn('[SCGatewayEvents] Invalid callback provided for subscription');
			return null;
		}

		const subscription = this.eventEmitter.addListener(nativeModule?.SCG_NOTIFICATION || 'scg_notification', (jsonString) => {
			if (!jsonString) {
				console.warn('[SCGatewayEvents] Received null/undefined event data');
				return;
			}

			let eventData;
			try {
				eventData = JSON.parse(jsonString);
			} catch (error) {
				console.warn('[SCGatewayEvents] Failed to parse event JSON:', error, 'Raw data:', jsonString);
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

	/**
	 * Unsubscribe from Gateway Events
	 * @param {GatewayEventSubscription} subscription - Subscription returned from subscribeToGatewayEvents
	 */
	unsubscribeFromGatewayEvents(subscription) {
		if (subscription && typeof subscription.remove === 'function') {
			try {
				subscription.remove();

				this.subscriptions = this.subscriptions.filter(sub => sub !== subscription);

				if (this.subscriptions.length === 0) {
					console.log('[SCGatewayEvents] No active subscriptions remaining, cleaning up');
					this.cleanup();
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
		} catch (error) {
			console.error('[SCGatewayEvents] Cleanup error:', error);
		}
	}
}

const scGatewayEventManager = new SCGatewayEvents();

export default scGatewayEventManager;