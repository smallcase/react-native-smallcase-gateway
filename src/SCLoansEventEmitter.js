// 💰 SCLoansEventEmitter.js - Unified Cross-Platform Loans Event System  
// 🔄 Single file for both Android & iOS - Loans Events Only

import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

// 🎯 Loans Event Types
export const SCLoansEventTypes = {
  LOAN_APPLICATION_STARTED: 'loanApplicationStarted',
  LOAN_APPLICATION_COMPLETED: 'loanApplicationCompleted',
  LOAN_APPLICATION_FAILED: 'loanApplicationFailed',
  LOAN_STATUS_UPDATED: 'loanStatusUpdated',
  LOAN_APPROVED: 'loanApproved',
  LOAN_REJECTED: 'loanRejected',
  LOAN_DISBURSED: 'loanDisbursed',
  PAYMENT_DUE: 'paymentDue',
  PAYMENT_COMPLETED: 'paymentCompleted',
  PAYMENT_FAILED: 'paymentFailed',
  KYC_REQUIRED: 'kycRequired',
  KYC_COMPLETED: 'kycCompleted',
  DOCUMENT_REQUIRED: 'documentRequired',
  DOCUMENT_UPLOADED: 'documentUploaded',
  LOANS_ERROR: 'loansError'
};

// 🎯 Loans Events Class
export class SCLoansEvents {
  constructor() {
    this.eventEmitter = null;
    this.listeners = new Map();
    this.isInitialized = false;
    
    this.initialize();
  }

  initialize() {
    try {
      const nativeModule = Platform.OS === 'ios' 
        ? NativeModules.SCLoansEventEmitter 
        : NativeModules.SCLoansEventEmitter;
      
      if (nativeModule) {
        this.eventEmitter = new NativeEventEmitter(nativeModule);
        this.isInitialized = true;
        console.log('[SCLoansEvents] ✅ Initialized for', Platform.OS);
      } else {
        console.warn('[SCLoansEvents] ⚠️ Native module not found for', Platform.OS);
      }
    } catch (error) {
      console.error('[SCLoansEvents] ❌ Initialization failed:', error);
    }
  }

  // 🎧 Subscribe to Loans Events
  subscribe(eventType, callback) {
    if (!this.isInitialized || !this.eventEmitter) {
      console.warn('[SCLoansEvents] ⚠️ Event emitter not initialized');
      return null;
    }

    try {
      const subscription = this.eventEmitter.addListener(eventType, callback);
      
      // Store for cleanup
      if (!this.listeners.has(eventType)) {
        this.listeners.set(eventType, []);
      }
      this.listeners.get(eventType).push(subscription);
      
      console.log(`[SCLoansEvents] 🎧 Subscribed to ${eventType}`);
      return subscription;
    } catch (error) {
      console.error(`[SCLoansEvents] ❌ Subscription failed for ${eventType}:`, error);
      return null;
    }
  }

  // 🔕 Unsubscribe from specific event
  unsubscribe(subscription) {
    if (subscription && typeof subscription.remove === 'function') {
      subscription.remove();
      console.log('[SCLoansEvents] 🔕 Unsubscribed from event');
    }
  }

  // 🧹 Clean up all listeners
  cleanup() {
    try {
      this.listeners.forEach((subscriptions, eventType) => {
        subscriptions.forEach(subscription => {
          if (subscription && typeof subscription.remove === 'function') {
            subscription.remove();
          }
        });
        console.log(`[SCLoansEvents] 🧹 Cleaned up ${subscriptions.length} listeners for ${eventType}`);
      });
      
      this.listeners.clear();
      console.log('[SCLoansEvents] ✅ All listeners cleaned up');
    } catch (error) {
      console.error('[SCLoansEvents] ❌ Cleanup error:', error);
    }
  }

  // 🎯 Convenience Methods for Loan Application Events
  onLoanApplicationStarted(callback) {
    return this.subscribe(SCLoansEventTypes.LOAN_APPLICATION_STARTED, callback);
  }

  onLoanApplicationCompleted(callback) {
    return this.subscribe(SCLoansEventTypes.LOAN_APPLICATION_COMPLETED, callback);
  }

  onLoanApplicationFailed(callback) {
    return this.subscribe(SCLoansEventTypes.LOAN_APPLICATION_FAILED, callback);
  }

  // 🎯 Convenience Methods for Loan Status Events
  onLoanStatusUpdated(callback) {
    return this.subscribe(SCLoansEventTypes.LOAN_STATUS_UPDATED, callback);
  }

  onLoanApproved(callback) {
    return this.subscribe(SCLoansEventTypes.LOAN_APPROVED, callback);
  }

  onLoanRejected(callback) {
    return this.subscribe(SCLoansEventTypes.LOAN_REJECTED, callback);
  }

  onLoanDisbursed(callback) {
    return this.subscribe(SCLoansEventTypes.LOAN_DISBURSED, callback);
  }

  // 🎯 Convenience Methods for Payment Events
  onPaymentDue(callback) {
    return this.subscribe(SCLoansEventTypes.PAYMENT_DUE, callback);
  }

  onPaymentCompleted(callback) {
    return this.subscribe(SCLoansEventTypes.PAYMENT_COMPLETED, callback);
  }

  onPaymentFailed(callback) {
    return this.subscribe(SCLoansEventTypes.PAYMENT_FAILED, callback);
  }

  // 🎯 Convenience Methods for KYC Events
  onKycRequired(callback) {
    return this.subscribe(SCLoansEventTypes.KYC_REQUIRED, callback);
  }

  onKycCompleted(callback) {
    return this.subscribe(SCLoansEventTypes.KYC_COMPLETED, callback);
  }

  // 🎯 Convenience Methods for Document Events
  onDocumentRequired(callback) {
    return this.subscribe(SCLoansEventTypes.DOCUMENT_REQUIRED, callback);
  }

  onDocumentUploaded(callback) {
    return this.subscribe(SCLoansEventTypes.DOCUMENT_UPLOADED, callback);
  }

  // 🎯 Convenience Method for Errors
  onLoansError(callback) {
    return this.subscribe(SCLoansEventTypes.LOANS_ERROR, callback);
  }
}

// 🎯 Export Singleton Instance
const scLoansEventManager = new SCLoansEvents();

// 🔄 Default export for backward compatibility
export default scLoansEventManager;

// 🎯 Named export for explicit usage
export { scLoansEventManager };