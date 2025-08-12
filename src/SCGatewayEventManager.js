// 📱 SCGatewayEventManager/index.js - Unified Cross-Platform SCGateway Event Manager
// 🎯 Automatically imports the correct platform-specific implementation

import { Platform } from 'react-native';

// Import platform-specific implementations
let SCGatewayEventManager, SCGatewayEvents, SCGatewayEventTypes;

if (Platform.OS === 'ios') {
  // Import iOS implementation
  const iosModule = require('./SCGatewayEventManager.ios');
  SCGatewayEventManager = iosModule.default;
  SCGatewayEvents = iosModule.SCGatewayEvents;
  SCGatewayEventTypes = iosModule.SCGatewayEventTypes;
} else if (Platform.OS === 'android') {
  // Import Android implementation
  const androidModule = require('./SCGatewayEventManager.android');
  SCGatewayEventManager = androidModule.default;
  SCGatewayEvents = androidModule.SCGatewayEvents;
  SCGatewayEventTypes = androidModule.SCGatewayEventTypes;
} else {
  // Fallback for unsupported platforms
  console.warn('SCGateway: Platform not supported');
  
  // Create mock implementations - use Android format as default
  SCGatewayEventTypes = {
    ANALYTICS_EVENT: 'scgateway_analytics_event',
    SUPER_PROPERTIES_UPDATED: 'scgateway_analytics_super_properties_updated',
    USER_RESET: 'scgateway_user_reset',
    USER_IDENTIFY: 'scgateway_user_identify',
  };

  class MockEventManager {
    constructor() {
      this.isListening = false;
    }

    async startListening() {
      console.warn('SCGateway: Event listening not supported on this platform');
      return Promise.resolve('Not supported');
    }

    async stopListening() {
      console.warn('SCGateway: Event listening not supported on this platform');
      return Promise.resolve('Not supported');
    }

    addEventListener(eventType, callback) {
      console.warn('SCGateway: Event listening not supported on this platform');
      return { remove: () => {} };
    }

    removeEventListener() {
      console.warn('SCGateway: Event listening not supported on this platform');
    }

    removeAllListeners() {
      console.warn('SCGateway: Event listening not supported on this platform');
    }

    async getListeningStatus() {
      return Promise.resolve({ isListening: false, isAnalyticsActive: false });
    }

    async emitTestEvent(eventType, testData) {
      console.warn('SCGateway: Test event emission not supported on this platform');
      return Promise.resolve('Not supported');
    }

    async getSupportedEvents() {
      return Promise.resolve(Object.values(SCGatewayEventTypes));
    }
  }

  SCGatewayEventManager = new MockEventManager();

  SCGatewayEvents = {
    onAnalyticsEvent: (callback) => ({ remove: () => {} }),
    onSuperPropertiesUpdated: (callback) => ({ remove: () => {} }),
    onUserReset: (callback) => ({ remove: () => {} }),
    onUserIdentify: (callback) => ({ remove: () => {} }),
    startListening: () => Promise.resolve('Not supported'),
    stopListening: () => Promise.resolve('Not supported'),
    removeAllListeners: () => {},
    getStatus: () => Promise.resolve({ isListening: false, isAnalyticsActive: false }),
    emitTestEvent: (eventType, testData) => Promise.resolve('Not supported'),
  };
}

export default SCGatewayEventManager;
export { SCGatewayEvents, SCGatewayEventTypes };