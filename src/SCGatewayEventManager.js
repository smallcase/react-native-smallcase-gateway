// 📱 SCGateway Event Manager - Compatibility Integration
// 🔄 Makes your existing Android, iOS implementations work together seamlessly
// 🎯 No major changes - just integration and compatibility helpers

import { Platform } from 'react-native';

// ========================================================================================
// 📋 IMPORT EXISTING IMPLEMENTATIONS
// ========================================================================================

let SCGatewayEventManager, SCGatewayEvents, SCGatewayEventTypes;
let SCLoansEventManager, SCLoansEvents, SCLoansEventTypes;

if (Platform.OS === 'ios') {
  // Import iOS implementation (when you have it)
  try {
    const iosModule = require('./SCGatewayEventManager.ios');
    SCGatewayEventManager = iosModule.default;
    SCGatewayEvents = iosModule.SCGatewayEvents;
    SCGatewayEventTypes = iosModule.SCGatewayEventTypes;
    
    // iOS Loans (if available)
    SCLoansEventManager = iosModule.scLoansEventManager;
    SCLoansEvents = iosModule.SCLoansEvents;
    SCLoansEventTypes = iosModule.SCLoansEventTypes;
  } catch (error) {
    console.warn('iOS implementation not found, using fallback');
  }
} else if (Platform.OS === 'android') {
  // Import your existing Android implementation
  try {
    const androidModule = require('./SCGatewayEventManager.android');
    SCGatewayEventManager = androidModule.default;
    SCGatewayEvents = androidModule.SCGatewayEvents;
    SCGatewayEventTypes = androidModule.SCGatewayEventTypes;
    
    // Android Loans
    SCLoansEventManager = androidModule.scLoansEventManager;
    SCLoansEvents = androidModule.SCLoansEvents;
    SCLoansEventTypes = androidModule.SCLoansEventTypes;
  } catch (error) {
    console.error('Failed to load Android implementation:', error);
  }
}

// ========================================================================================
// 🛠️ COMPATIBILITY HELPERS & UTILITIES
// ========================================================================================

// Simple event aggregator to work with both systems
class EventAggregator {
  constructor() {
    this.listeners = new Map();
    this.gatewaySubscriptions = new Map();
    this.loansSubscriptions = new Map();
  }

  // Listen to events from both Gateway and Loans with unified callback
  onBothSystems(eventConfig, callback) {
    const subscriptions = [];

    // Gateway subscription
    if (eventConfig.gateway && SCGatewayEvents) {
      const gatewaySub = SCGatewayEvents.addEventListener?.(
        eventConfig.gateway,
        (payload) => callback('gateway', eventConfig.gateway, payload)
      );
      if (gatewaySub) subscriptions.push(gatewaySub);
    }

    // Loans subscription
    if (eventConfig.loans && SCLoansEvents) {
      const loansSub = SCLoansEvents.addEventListener?.(
        eventConfig.loans,
        (payload) => callback('loans', eventConfig.loans, payload)
      );
      if (loansSub) subscriptions.push(loansSub);
    }

    return {
      remove: () => subscriptions.forEach(sub => sub.remove?.()),
      subscriptions
    };
  }

  // Helper to start both systems
  async startBoth() {
    const results = {};

    if (SCGatewayEvents?.startListening) {
      try {
        results.gateway = await SCGatewayEvents.startListening();
      } catch (error) {
        results.gateway = { error: error.message };
      }
    }

    if (SCLoansEvents?.startListening) {
      try {
        results.loans = await SCLoansEvents.startListening();
      } catch (error) {
        results.loans = { error: error.message };
      }
    }

    return results;
  }

  // Helper to stop both systems
  async stopBoth() {
    const results = {};

    if (SCGatewayEvents?.stopListening) {
      try {
        results.gateway = await SCGatewayEvents.stopListening();
      } catch (error) {
        results.gateway = { error: error.message };
      }
    }

    if (SCLoansEvents?.stopListening) {
      try {
        results.loans = await SCLoansEvents.stopListening();
      } catch (error) {
        results.loans = { error: error.message };
      }
    }

    return results;
  }

  // Get status from both systems
  async getBothStatus() {
    const status = {
      platform: Platform.OS,
      timestamp: Date.now(),
      gateway: null,
      loans: null
    };

    if (SCGatewayEvents?.getStatus) {
      try {
        status.gateway = await SCGatewayEvents.getStatus();
      } catch (error) {
        status.gateway = { error: error.message };
      }
    }

    if (SCLoansEvents?.getStatus) {
      try {
        status.loans = await SCLoansEvents.getStatus();
      } catch (error) {
        status.loans = { error: error.message };
      }
    }

    return status;
  }
}

// ========================================================================================
// 🔗 COMPATIBILITY WRAPPER FOR MISSING IMPLEMENTATIONS
// ========================================================================================

// Create fallback implementations if needed
if (!SCGatewayEventManager || !SCLoansEventManager) {
  console.warn('Creating fallback implementations for missing modules');

  // Fallback event types
  const FallbackGatewayEventTypes = {
    ANALYTICS_EVENT: 'scgateway_analytics_event',
    SUPER_PROPERTIES_UPDATED: 'scgateway_super_properties_updated',
    USER_RESET: 'scgateway_user_reset',
    USER_IDENTIFY: 'scgateway_user_identify',
  };

  const FallbackLoansEventTypes = {
    ANALYTICS_EVENT: 'scloans_analytics_event',
    SUPER_PROPERTIES_UPDATED: 'scloans_super_properties_updated',
    LOANS_EVENT: 'scloans_event',
    LOANS_NOTIFICATION: 'scloans_notification',
  };

  // Fallback manager class
  class FallbackEventManager {
    constructor(name) {
      this.name = name;
      this.isListening = false;
    }

    async startListening() {
      console.warn(`${this.name}: Event listening not supported on ${Platform.OS}`);
      return Promise.resolve('Not supported');
    }

    async stopListening() {
      console.warn(`${this.name}: Event listening not supported on ${Platform.OS}`);
      return Promise.resolve('Not supported');
    }

    addEventListener(eventType, callback) {
      console.warn(`${this.name}: addEventListener not supported on ${Platform.OS}`);
      return { remove: () => {} };
    }

    removeEventListener() {
      console.warn(`${this.name}: removeEventListener not supported on ${Platform.OS}`);
    }

    removeAllListeners() {
      console.warn(`${this.name}: removeAllListeners not supported on ${Platform.OS}`);
    }

    async getListeningStatus() {
      return Promise.resolve({ 
        isListening: false, 
        platform: Platform.OS,
        supported: false 
      });
    }

    async emitTestEvent(eventType, testData) {
      console.warn(`${this.name}: Test events not supported on ${Platform.OS}`);
      return Promise.resolve('Not supported');
    }

    async getSupportedEvents() {
      return Promise.resolve([]);
    }
  }

  // Create fallback instances if needed
  if (!SCGatewayEventManager) {
    SCGatewayEventManager = new FallbackEventManager('SCGateway');
    SCGatewayEventTypes = FallbackGatewayEventTypes;
    SCGatewayEvents = {
      onAnalyticsEvent: (callback) => ({ remove: () => {} }),
      onSuperPropertiesUpdated: (callback) => ({ remove: () => {} }),
      onUserReset: (callback) => ({ remove: () => {} }),
      onUserIdentify: (callback) => ({ remove: () => {} }),
      startListening: () => Promise.resolve('Not supported'),
      stopListening: () => Promise.resolve('Not supported'),
      removeAllListeners: () => {},
      getStatus: () => Promise.resolve({ isListening: false, supported: false }),
      emitTestEvent: () => Promise.resolve('Not supported'),
    };
  }

  if (!SCLoansEventManager) {
    SCLoansEventManager = new FallbackEventManager('SCLoans');
    SCLoansEventTypes = FallbackLoansEventTypes;
    SCLoansEvents = {
      onAnalyticsEvent: (callback) => ({ remove: () => {} }),
      onSuperPropertiesUpdated: (callback) => ({ remove: () => {} }),
      onLoansEvent: (callback) => ({ remove: () => {} }),
      onLoansNotification: (callback) => ({ remove: () => {} }),
      startListening: () => Promise.resolve('Not supported'),
      stopListening: () => Promise.resolve('Not supported'),
      removeAllListeners: () => {},
      getStatus: () => Promise.resolve({ isListening: false, supported: false }),
      emitTestEvent: () => Promise.resolve('Not supported'),
      postAnalyticsEvent: () => Promise.resolve('Not supported'),
      getEventStats: () => Promise.resolve({}),
      getCachedEvents: () => Promise.resolve([]),
    };
  }
}

// ========================================================================================
// 🎯 CONVENIENCE FUNCTIONS FOR WORKING WITH BOTH SYSTEMS
// ========================================================================================

// Create the event aggregator instance
const eventAggregator = new EventAggregator();

// Convenience functions that work with your existing code
export const SCGatewayLoansUtils = {
  // Start both systems at once
  async startBothSystems() {
    console.log('🚀 Starting both Gateway and Loans systems...');
    const results = await eventAggregator.startBoth();
    console.log('✅ Start results:', results);
    return results;
  },

  // Stop both systems at once
  async stopBothSystems() {
    console.log('🛑 Stopping both Gateway and Loans systems...');
    const results = await eventAggregator.stopBoth();
    console.log('✅ Stop results:', results);
    return results;
  },

  // Get status from both systems
  async getBothSystemsStatus() {
    return await eventAggregator.getBothStatus();
  },

  // Listen to analytics events from both systems
  onAnalyticsFromBoth(callback) {
    return eventAggregator.onBothSystems(
      {
        gateway: SCGatewayEventTypes.ANALYTICS_EVENT,
        loans: SCLoansEventTypes.ANALYTICS_EVENT
      },
      callback
    );
  },

  // Listen to super properties updates from both systems
  onSuperPropertiesFromBoth(callback) {
    return eventAggregator.onBothSystems(
      {
        gateway: SCGatewayEventTypes.SUPER_PROPERTIES_UPDATED,
        loans: SCLoansEventTypes.SUPER_PROPERTIES_UPDATED
      },
      callback
    );
  },

  // Test both systems
  async testBothSystems() {
    const testResults = {};

    // Test Gateway
    if (SCGatewayEvents?.emitTestEvent) {
      try {
        testResults.gateway = await SCGatewayEvents.emitTestEvent(
          SCGatewayEventTypes.ANALYTICS_EVENT,
          { test: true, timestamp: Date.now() }
        );
      } catch (error) {
        testResults.gateway = { error: error.message };
      }
    }

    // Test Loans
    if (SCLoansEvents?.emitTestEvent) {
      try {
        testResults.loans = await SCLoansEvents.emitTestEvent(
          SCLoansEventTypes.ANALYTICS_EVENT,
          { test: true, timestamp: Date.now() }
        );
      } catch (error) {
        testResults.loans = { error: error.message };
      }
    }

    return testResults;
  },

  // Check what's available on current platform
  getAvailability() {
    return {
      platform: Platform.OS,
      gateway: {
        available: !!SCGatewayEventManager && SCGatewayEventManager.name !== 'FallbackEventManager',
        events: !!SCGatewayEvents,
        eventTypes: Object.keys(SCGatewayEventTypes || {})
      },
      loans: {
        available: !!SCLoansEventManager && SCLoansEventManager.name !== 'FallbackEventManager',
        events: !!SCLoansEvents,
        eventTypes: Object.keys(SCLoansEventTypes || {})
      }
    };
  }
};

// ========================================================================================
// 🔄 INTEGRATION HELPERS FOR YOUR EXISTING CODE
// ========================================================================================

// Helper to easily switch between systems in your existing code
export const createEventListener = (system, eventType, callback, options = {}) => {
  if (system === 'gateway' && SCGatewayEventManager) {
    return SCGatewayEventManager.addEventListener(eventType, callback);
  } else if (system === 'loans' && SCLoansEventManager) {
    return SCLoansEventManager.addEventListener(eventType, callback);
  } else {
    console.warn(`System '${system}' not available on ${Platform.OS}`);
    return { remove: () => {} };
  }
};

// Helper to post analytics to the appropriate system
export const postAnalytics = async (system, eventName, properties = {}) => {
  if (system === 'loans' && SCLoansEvents?.postAnalyticsEvent) {
    return await SCLoansEvents.postAnalyticsEvent(eventName, properties);
  } else if (system === 'gateway' && SCGatewayEvents?.emitTestEvent) {
    // Gateway doesn't have postAnalyticsEvent, so use test event
    return await SCGatewayEvents.emitTestEvent(SCGatewayEventTypes.ANALYTICS_EVENT, {
      eventName,
      properties
    });
  } else {
    console.warn(`Analytics posting not available for system '${system}' on ${Platform.OS}`);
    return Promise.resolve('Not available');
  }
};

// ========================================================================================
// 📤 EXPORTS (Your existing structure maintained)
// ========================================================================================

// Default export (Gateway manager - unchanged for backward compatibility)
export default SCGatewayEventManager;

// Gateway exports (unchanged)
export { SCGatewayEvents, SCGatewayEventTypes };

// Loans exports (unchanged)
export { 
  SCLoansEventManager as scLoansEventManager, 
  SCLoansEvents, 
  SCLoansEventTypes 
};

// Additional utility exports
export { eventAggregator };

// ========================================================================================
// 🎮 USAGE EXAMPLES FOR YOUR REFERENCE
// ========================================================================================

/*
// Example 1: Use your existing code as-is
import SCGatewayEventManager, { SCGatewayEvents, SCLoansEvents } from './SCGatewayEventManager';

const subscription = SCGatewayEvents.onAnalyticsEvent((payload) => {
  console.log('Gateway analytics:', payload);
});

// Example 2: Use new convenience functions
import { SCGatewayLoansUtils } from './SCGatewayEventManager';

// Start both systems
await SCGatewayLoansUtils.startBothSystems();

// Listen to analytics from both
const bothSub = SCGatewayLoansUtils.onAnalyticsFromBoth((system, eventType, payload) => {
  console.log(`Analytics from ${system}:`, payload);
});

// Example 3: Check availability
const availability = SCGatewayLoansUtils.getAvailability();
console.log('What\'s available:', availability);

// Example 4: Post analytics to specific system
await postAnalytics('loans', 'user_action', { action: 'button_click' });
*/

console.log(`📱 SCGateway Event Manager loaded for ${Platform.OS}`);
console.log('🔍 Availability:', SCGatewayLoansUtils.getAvailability());