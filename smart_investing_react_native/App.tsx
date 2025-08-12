import React from 'react';
import SmallcaseGateway, { ScLoan } from 'react-native-smallcase-gateway';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { KeyboardAvoidingView, Platform as RNPlatform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Your screen imports
import { SstScreen } from './app/screens/SstScreen';
import { ConnectScreenStack } from './app/screens/ConnectScreen';
import { EnvProvider } from './app/EnvProvider';
import { SmtScreen } from './app/screens/SmtScreen';
import { HoldingsScreenStack } from './app/screens/HoldingsScreen';
import { LeadGenScreen } from './app/screens/LeadGenScreen';
import { SstCartProvider } from './app/SstCartProvider';

const Tab = createBottomTabNavigator();

interface AppState {
  isSdkInitialized: boolean;
  sdkVersion: string | null;
  lastEvent: any | null;
  lastLoansEvent: any | null;
}

interface AppProps {
  [key: string]: any;
}

class App extends React.Component<AppProps, AppState> {
  private eventSubscription: any = null;
  private legacyEventSubscriptions: any[] = [];
  private loansEventSubscriptions: any[] = [];

  constructor(props: AppProps) {
    super(props);
    this.state = {
      isSdkInitialized: false,
      sdkVersion: null,
      lastEvent: null,
      lastLoansEvent: null
    };
  }

  componentDidMount() {
    console.log('🚀 App mounted - Initializing SmallcaseGateway SDK');
    this.initializeSDK();
  }

  componentWillUnmount() {
    console.log('🧹 App unmounting - Cleaning up all event listeners');
    this.cleanupAllEventListeners();
  }

  initializeSDK = async () => {
    try {
      console.log('🔧 Initializing SmallcaseGateway SDK...');
      
      // Set configuration environment first
      await SmallcaseGateway.setConfigEnvironment({
        gatewayName: 'SmartInvestingApp',
        isLeprechaun: false,
        isAmoEnabled: true,
        brokerList: ['zerodha', 'upstox', 'angelone'],
        environmentName: 'development' // Change to 'production' for production
      });
      
      console.log('✅ Configuration set successfully');
      
      // Get SDK version
      const sdkVersion = await SmallcaseGateway.getSdkVersion();
      console.log('📦 SDK Version:', sdkVersion);
      
      this.setState({ 
        isSdkInitialized: true, 
        sdkVersion: sdkVersion 
      });
      
      // Setup event listeners after SDK is initialized
      this.setupEventListeners();
      
    } catch (error) {
      console.error('❌ Failed to initialize SDK:', error);
    }
  };

  setupEventListeners = () => {
    console.log('🎯 Setting up event listeners... Platform:', RNPlatform.OS);
    
    // Platform-specific event handling
    if (RNPlatform.OS === 'ios') {
      this.setupIOSEventListeners();
      this.setupIOSLoansEventListeners();
    } else {
      this.setupAndroidEventListeners();
    }
    
    // Also setup legacy event listeners for backward compatibility
    // this.setupLegacyEventListeners();
    
    console.log('✅ Event listeners setup complete');
  };

  setupIOSEventListeners = () => {
    console.log('🍎 Setting up iOS-specific event listeners...');
    
    // Use the legacy event manager for iOS-specific gatewayEvents
    const { gatewayEventManager, gatewayEvents } = SmallcaseGateway as any;
    
    // // Start listening to iOS gatewayEvents
    // gatewayEventManager.startListening().then(() => {
    //   console.log('✅ iOS event manager started listening');
    // }).catch((error: any) => {
    //   console.error('❌ Failed to start iOS event manager:', error);
    // });
    
    // Add listeners for iOS-specific gatewayEvents
    const analyticsSubscription = gatewayEvents.onAnalyticsEvent((data: any) => {
      console.log('[App] <- iOS analytics event:', data);
      this.handleAnalyticsEvent(data);
    });
    
    const superPropsSubscription = gatewayEvents.onSuperPropertiesUpdated((data: any) => {
      console.log('[App] <- iOS super properties updated:', data);
      this.handleSuperPropsUpdated(data);
    });
    
    const userResetSubscription = gatewayEvents.onUserReset((data: any) => {
      console.log('[App] <- iOS user reset:', data);
      this.handleUserReset(data);
    });
    
    const userIdentifySubscription = gatewayEvents.onUserIdentify((data: any) => {
      console.log('[App] <- iOS user identify:', data);
      this.handleUserIdentify(data);
    });
    
    // Store subscriptions for cleanup
    this.legacyEventSubscriptions.push(
      analyticsSubscription,
      superPropsSubscription,
      userResetSubscription,
      userIdentifySubscription
    );
  };

  setupIOSLoansEventListeners = () => {
    console.log('🏦 Setting up iOS-specific SCLoans event listeners...');
    
    // Import ScLoan to get the correct event manager and events
   const { loansEvents, loansEventManager } = ScLoan as any;
    
    // Check if the event manager is available
    if (!loansEventManager) {
      console.error('❌ SCLoans event manager is not available');
      return;
    }
    
    console.log('✅ SCLoans event manager found:', loansEventManager);
    
    // Start listening to SCLoans events
    loansEventManager.startListening().then(() => {
      console.log('✅ SCLoans event manager started listening');
    }).catch((error: any) => {
      console.error('❌ Failed to start SCLoans event manager:', error);
    });
    
    // Add listener for SCLoans notifications
    const loansNotificationSubscription = loansEvents.onAnalyticsEvent((data: any) => {
      console.log('[App] <- iOS SCLoans analytics event:', data);
      
      // Update state with the latest loans event
      this.setState({ lastLoansEvent: data });
      
      if (!data || !data.type) {
        console.warn('SCLoans event missing type:', data);
        return;
      }
      
      // Handle different types of SCLoans events
      switch (data.type) {
        case 'scloans_analytics_event':
          console.log("🏦 SCLoans Analytics Event:", data);
          this.handleSCLoansAnalyticsEvent(data);
          break;
          
        case 'scloans_super_properties_updated':
          console.log("🏦 SCLoans Super Properties Updated:", data);
          this.handleSCLoansSuperPropsUpdated(data);
          break;
          
        case 'scloans_user_reset':
          console.log("🏦 SCLoans User Reset:", data);
          this.handleSCLoansUserReset(data);
          break;
          
        case 'scloans_user_identify':
          console.log("🏦 SCLoans User Identify:", data);
          this.handleSCLoansUserIdentify(data);
          break;
          
        case 'scloans_loan_application_started':
          console.log("🏦 SCLoans Loan Application Started:", data);
          this.handleSCLoansLoanApplicationStarted(data);
          break;
          
        case 'scloans_loan_application_completed':
          console.log("🏦 SCLoans Loan Application Completed:", data);
          this.handleSCLoansLoanApplicationCompleted(data);
          break;
          
        case 'scloans_loan_application_failed':
          console.log("🏦 SCLoans Loan Application Failed:", data);
          this.handleSCLoansLoanApplicationFailed(data);
          break;
          
        case 'scloans_loan_status_updated':
          console.log("🏦 SCLoans Loan Status Updated:", data);
          this.handleSCLoansLoanStatusUpdated(data);
          break;
          
        default:
          console.warn('🔍 Unknown SCLoans event type:', data.type, 'Data:', data);
          this.handleUnknownLoansEvent(data);
      }
    });
    
    // Also try to listen directly for the specific event types that are being emitted
    // This is a fallback in case the notification channel doesn't work
    // try {
    //   const { NativeEventEmitter, NativeModules } = require('react-native');
    //   const { SCLoansBridgeEmitter } = NativeModules;
      
    //   if (SCLoansBridgeEmitter) {
    //     console.log('🔧 Setting up direct SCLoans event listener...');
    //     const directEventEmitter = new NativeEventEmitter(SCLoansBridgeEmitter);
        
    //     const directSubscription = directEventEmitter.addListener('scloans_notification', (data: any) => {
    //       console.log('🏦 Direct SCLoans Analytics Event Received:', data);
    //       this.setState({ lastLoansEvent: { type: 'scloans_notification', data } });
    //       this.handleSCLoansAnalyticsEvent(data);
    //     });
        
    //     this.loansEventSubscriptions.push(directSubscription);
    //     console.log('✅ Direct SCLoans event listener added');
    //   }
    // } catch (error) {
    //   console.error('❌ Failed to setup direct SCLoans event listener:', error);
    // }
    
    // Store subscriptions for cleanup
    this.loansEventSubscriptions.push(loansNotificationSubscription);
    
    console.log('✅ SCLoans event listeners setup complete');
  };

  setupAndroidEventListeners = async () => {
    console.log('🤖 Setting up Android event listeners...');
    const { gatewayEventManager, gatewayEvents } = SmallcaseGateway as any;

    try {
      const result = await gatewayEventManager.startListening();
      console.log('✅ Android event manager started listening', result);
      try {
        const status = await gatewayEventManager.getStatus?.();
        console.log('ℹ️ Android event manager status:', status);
      } catch {}
    } catch (error) {
      console.error('❌ Failed to start Android event manager:', error);
    }

    const analyticsSubscription = gatewayEvents.onAnalyticsEvent((data: any) => {
      console.log('[App] <- Android analytics event:', data);
      this.setState({ lastEvent: { type: 'scgateway_analytics_event', data } });
      this.handleAnalyticsEvent(data);
    });

    const superPropsSubscription = gatewayEvents.onSuperPropertiesUpdated((data: any) => {
      console.log('[App] <- Android super properties updated:', data);
      this.setState({ lastEvent: { type: 'scgateway_super_properties_updated', data } });
      this.handleSuperPropsUpdated(data);
    });

    const userResetSubscription = gatewayEvents.onUserReset((data: any) => {
      console.log('[App] <- Android user reset:', data);
      this.setState({ lastEvent: { type: 'scgateway_user_reset', data } });
      this.handleUserReset(data);
    });

    const userIdentifySubscription = gatewayEvents.onUserIdentify((data: any) => {
      console.log('[App] <- Android user identify:', data);
      this.setState({ lastEvent: { type: 'scgateway_user_identify', data } });
      this.handleUserIdentify(data);
    });

    this.legacyEventSubscriptions.push(
      analyticsSubscription,
      superPropsSubscription,
      userResetSubscription,
      userIdentifySubscription
    );
  };

  // setupLegacyEventListeners = () => {
  //   console.log('🔄 Setting up legacy event listeners for cross-platform compatibility...');
    
  //   // Add a general event listener that works on both platforms
  //   const generalSubscription = (SmallcaseGateway as any).addEventsListener((event: any) => {
  //     console.log('\n🎉 === General SmallcaseGateway Event Received ===');
  //     console.log('Platform:', RNPlatform.OS);
  //     console.log('Event Type:', event.type);
  //     console.log('Event Data:', event.data);
  //     console.log('Timestamp:', new Date().toISOString());
      
  //     this.setState({ lastEvent: event });
      
  //     // Handle gatewayEvents regardless of platform
  //     this.handleGeneralEvent(event);
      
  //     console.log('=== End General SmallcaseGateway Event ===\n');
  //   });
    
  //   this.legacyEventSubscriptions.push(generalSubscription);
  // };

  cleanupAllEventListeners = () => {
    console.log('🧹 Cleaning up all event listeners...');
    
    // Clean up main event subscription
    if (this.eventSubscription) {
      this.eventSubscription.remove();
      this.eventSubscription = null;
    }
    
    // Clean up legacy event subscriptions
    this.legacyEventSubscriptions.forEach(subscription => {
      if (subscription && subscription.remove) {
        subscription.remove();
      }
    });
    this.legacyEventSubscriptions = [];

    // Clean up loans event subscriptions
    this.loansEventSubscriptions.forEach(subscription => {
      if (subscription && subscription.remove) {
        subscription.remove();
      }
    });
    this.loansEventSubscriptions = [];
    
    // Stop platform event managers if running
    const { gatewayEventManager, loansEventManager } = SmallcaseGateway as any;
    if (gatewayEventManager && gatewayEventManager.stopListening) {
      gatewayEventManager.stopListening().catch(() => {});
    }
    if (RNPlatform.OS === 'ios' && loansEventManager && loansEventManager.stopListening) {
      loansEventManager.stopListening().catch(() => {});
    }
    
    console.log('✅ All event listeners cleaned up');
  };

  // General event handler for cross-platform compatibility
  handleGeneralEvent = (event: any) => {
    console.log('🌐 Processing general event:', event.type);
    
    // Handle common event types that work across platforms
    switch (event.type) {
      case 'scg_analytics_event':
      case 'scgateway_analytics_event':
        this.handleAnalyticsEvent(event.data);
        break;
        
      case 'scg_transaction_success':
        this.handleTransactionSuccess(event.data);
        break;
        
      case 'scg_transaction_failed':
        this.handleTransactionFailure(event.data);
        break;
        
      case 'scg_leadgen_success':
        this.handleLeadGenSuccess(event.data);
        break;
        
      case 'scg_leadgen_failed':
        this.handleLeadGenFailure(event.data);
        break;
        
      default:
        console.log('🔍 Unknown general event type:', event.type);
    }
  };

  // // Loans Event Handlers
  // handleLoansNotificationEvent = (data: any) => {
  //   console.log('🏦 Processing Loans Notification Event:', data);
    
  //   try {
  //     // Update state with the latest loans event
  //     this.setState({ lastLoansEvent: data });
      
  //     // Extract event type and properties from loans notification
  //     const eventType = data.type || 'unknown_loans_event';
  //     const eventData = data.data || data;
      
  //     // Handle different types of loans events
  //     switch (eventType) {
  //       case 'loans_application_started':
  //         this.handleLoansApplicationStarted(eventData);
  //         break;
          
  //       case 'loans_application_completed':
  //         this.handleLoansApplicationCompleted(eventData);
  //         break;
          
  //       case 'loans_application_failed':
  //         this.handleLoansApplicationFailed(eventData);
  //         break;
          
  //       case 'loans_status_updated':
  //         this.handleLoansStatusUpdated(eventData);
  //         break;
          
  //       case 'loans_document_uploaded':
  //         this.handleLoansDocumentUploaded(eventData);
  //         break;
          
  //       case 'loans_approval_received':
  //         this.handleLoansApprovalReceived(eventData);
  //         break;
          
  //       case 'loans_disbursement_completed':
  //         this.handleLoansDisbursementCompleted(eventData);
  //         break;
          
  //       default:
  //         console.log('🔍 Unknown loans event type:', eventType, 'Data:', eventData);
  //         this.handleUnknownLoansEvent({ type: eventType, data: eventData });
  //     }
      
  //     // Track loans events in analytics
  //     // analytics().logEvent('loans_notification', {
  //     //   event_type: eventType,
  //     //   timestamp: Date.now()
  //     // });
      
  //   } catch (error) {
  //     console.error('❌ Failed to process loans notification event:', error);
  //   }
  // };

  handleSCLoansAnalyticsEvent = (data: any) => {
    console.log('🏦 Processing SCLoans Analytics Event:', data);
    
    try {
      // Extract event properties
      const eventName = data.eventName || data.event || 'unknown_scloans_event';
      const properties = data.properties || data.params || {};
      
      // Send to your analytics service
      // Example integrations:
      // Firebase Analytics
      // analytics().logEvent(eventName, properties);
      
      // Mixpanel
      // mixpanel.track(eventName, properties);
      
      // Custom Analytics
      // yourAnalyticsService.track(eventName, properties);
      
      // console.log('✅ SCLoans Analytics event processed:', { eventName, properties });
      
    } catch (error) {
      console.error('❌ Failed to process SCLoans analytics event:', error);
    }
  };

  handleSCLoansSuperPropsUpdated = (data: any) => {
    console.log('🔄 Processing SCLoans Super Properties Update:', data);
    
    try {
      // Update user properties in your analytics service
      // analytics().setUserProperties(data);
      // mixpanel.people.set(data);
      
      console.log('✅ SCLoans Super properties updated');
      
    } catch (error) {
      console.error('❌ Failed to update SCLoans super properties:', error);
    }
  };

  handleSCLoansUserReset = (data: any) => {
    console.log('🔄 Processing SCLoans User Reset');
    
    try {
      // Reset user session in your analytics
      // analytics().reset();
      // mixpanel.reset();
      
      // Clear any user-specific data in your app
      // this.clearUserData();
      
      console.log('✅ SCLoans User reset processed');
      
    } catch (error) {
      console.error('❌ Failed to process SCLoans user reset:', error);
    }
  };

  handleSCLoansUserIdentify = (data: any) => {
    console.log('👤 Processing SCLoans User Identify:', data);
    
    try {
      const userId = data.userId || data.id;
      const userProperties = data.properties || data.traits || {};
      
      // Identify user in your analytics
      // analytics().identify(userId, userProperties);
      // mixpanel.identify(userId);
      // mixpanel.people.set(userProperties);
      
      console.log('✅ SCLoans User identified:', { userId, userProperties });
      
    } catch (error) {
      console.error('❌ Failed to identify SCLoans user:', error);
    }
  };

  handleSCLoansLoanApplicationStarted = (data: any) => {
    console.log('🏦 Processing SCLoans Loan Application Started:', data);
    
    try {
      const applicationId = data.applicationId || data.id;
      const loanAmount = data.loanAmount || data.amount;
      const loanType = data.loanType || data.type;
      
      // Track loan application start
      // analytics().logEvent('loans_application_started', {
      //   application_id: applicationId,
      //   loan_amount: loanAmount,
      //   loan_type: loanType,
      //   timestamp: Date.now()
      // });
      
      // Update UI to show application in progress
      // this.setState({ loanApplicationStatus: 'started' });
      
      console.log('✅ SCLoans loans application started processed');
      
    } catch (error) {
      console.error('❌ Failed to process SCLoans loans application started:', error);
    }
  };

  handleSCLoansLoanApplicationCompleted = (data: any) => {
    console.log('🏦 Processing SCLoans Loan Application Completed:', data);
    
    try {
      const applicationId = data.applicationId || data.id;
      const loanAmount = data.loanAmount || data.amount;
      
      // Track successful loan application
      // analytics().logEvent('loans_application_completed', {
      //   application_id: applicationId,
      //   loan_amount: loanAmount,
      //   timestamp: Date.now()
      // });
      
      // Show success message
      // this.showSuccessMessage('Loan application submitted successfully!');
      
      // Update UI state
      // this.setState({ loanApplicationStatus: 'completed' });
      
      console.log('✅ SCLoans loans application completed processed');
      
    } catch (error) {
      console.error('❌ Failed to process SCLoans loans application completed:', error);
    }
  };

  handleSCLoansLoanApplicationFailed = (data: any) => {
    console.log('🏦 Processing SCLoans Loan Application Failed:', data);
    
    try {
      const applicationId = data.applicationId || data.id;
      const error = data.error || data.errorMessage;
      const errorCode = data.errorCode;
      
      // Track failed loan application
      // analytics().logEvent('loans_application_failed', {
      //   application_id: applicationId,
      //   error: error,
      //   error_code: errorCode,
      //   timestamp: Date.now()
      // });
      
      // Show error message
      // this.showErrorMessage(`Loan application failed: ${error}`);
      
      // Update UI state
      // this.setState({ loanApplicationStatus: 'failed', lastError: error });
      
      console.log('✅ SCLoans loans application failed processed');
      
    } catch (error) {
      console.error('❌ Failed to process SCLoans loans application failed:', error);
    }
  };

  handleSCLoansLoanStatusUpdated = (data: any) => {
    console.log('🏦 Processing SCLoans Loan Status Updated:', data);
    
    try {
      const applicationId = data.applicationId || data.id;
      const newStatus = data.status;
      const previousStatus = data.previousStatus;
      
      // Track status update
      // analytics().logEvent('loans_status_updated', {
      //   application_id: applicationId,
      //   new_status: newStatus,
      //   previous_status: previousStatus,
      //   timestamp: Date.now()
      // });
      
      // Update UI with new status
      // this.setState({ loanStatus: newStatus });
      
      // Show notification if status is significant
      if (newStatus === 'approved' || newStatus === 'rejected') {
        // this.showSuccessMessage(`Loan application ${newStatus}!`);
      }
      
      console.log('✅ SCLoans loans status updated processed');
      
    } catch (error) {
      console.error('❌ Failed to process SCLoans loans status updated:', error);
    }
  };

  handleSCLoansDocumentUploaded = (data: any) => {
    console.log('🏦 Processing SCLoans Document Uploaded:', data);
    
    try {
      const applicationId = data.applicationId || data.id;
      const documentType = data.documentType;
      const documentId = data.documentId;
      
      // Track document upload
      // analytics().logEvent('loans_document_uploaded', {
      //   application_id: applicationId,
      //   document_type: documentType,
      //   document_id: documentId,
      //   timestamp: Date.now()
      // });
      
      // Show success message
      // this.showSuccessMessage(`${documentType} uploaded successfully!`);
      
      console.log('✅ SCLoans document uploaded processed');
      
    } catch (error) {
      console.error('❌ Failed to process SCLoans document uploaded:', error);
    }
  };

  handleSCLoansApprovalReceived = (data: any) => {
    console.log('🏦 Processing SCLoans Approval Received:', data);
    
    try {
      const applicationId = data.applicationId || data.id;
      const approvedAmount = data.approvedAmount || data.amount;
      const interestRate = data.interestRate;
      const tenure = data.tenure;
      
      // Track loan approval
      // analytics().logEvent('loans_approval_received', {
      //   application_id: applicationId,
      //   approved_amount: approvedAmount,
      //   interest_rate: interestRate,
      //   tenure: tenure,
      //   timestamp: Date.now()
      // });
      
      // Show success message with details
      // this.showSuccessMessage(
      //   `Congratulations! Your loan of ₹${approvedAmount} has been approved at ${interestRate}% interest!`
      // );
      
      // Update UI state
      // this.setState({ 
      //   loanStatus: 'approved',
      //   approvedAmount: approvedAmount,
      //   interestRate: interestRate
      // });
      
      console.log('✅ SCLoans approval received processed');
      
    } catch (error) {
      console.error('❌ Failed to process SCLoans approval received:', error);
    }
  };

  handleSCLoansDisbursementCompleted = (data: any) => {
    console.log('🏦 Processing SCLoans Disbursement Completed:', data);
    
    try {
      const applicationId = data.applicationId || data.id;
      const disbursedAmount = data.disbursedAmount || data.amount;
      const bankAccount = data.bankAccount;
      const referenceNumber = data.referenceNumber;
      
      // Track loan disbursement
      // analytics().logEvent('loans_disbursement_completed', {
      //   application_id: applicationId,
      //   disbursed_amount: disbursedAmount,
      //   reference_number: referenceNumber,
      //   timestamp: Date.now()
      // });
      
      // Show success message
      // this.showSuccessMessage(
      //   `Loan amount ₹${disbursedAmount} has been disbursed to your account!`
      // );
      
      // Update UI state
      // this.setState({ 
      //   loanStatus: 'disbursed',
      //   disbursedAmount: disbursedAmount
      // });
      
      console.log('✅ Loans disbursement completed processed');
      
    } catch (error) {
      console.error('❌ Failed to process loans disbursement completed:', error);
    }
  };

  handleUnknownLoansEvent = (event: any) => {
    console.log('🔍 Processing Unknown Loans Event:', event);
    
    // Log unknown loans events for debugging
    // analytics().logEvent('unknown_loans_event', {
    //   event_type: event.type,
    //   event_data: JSON.stringify(event.data),
    //   timestamp: Date.now()
    // });
  };

  // Gateway Event Handlers (existing)
  handleAnalyticsEvent = (data: any) => {
    console.log('📊 Processing Analytics Event:', data);
    
    try {
      // Extract event properties
      const eventName = data.eventName || data.event || 'unknown_event';
      const properties = data.properties || data.params || {};
      
      // Send to your analytics service
      // Example integrations:
      // Firebase Analytics
      // analytics().logEvent(eventName, properties);
      
      // Mixpanel
      // mixpanel.track(eventName, properties);
      
      // Custom Analytics
      // yourAnalyticsService.track(eventName, properties);
      
      // console.log('✅ Analytics event processed:', { eventName, properties });
      
    } catch (error) {
      console.error('❌ Failed to process analytics event:', error);
    }
  };

  handleSuperPropsUpdated = (data: any) => {
    console.log('🔄 Processing Super Properties Update:', data);
    
    try {
      // Update user properties in your analytics service
      // analytics().setUserProperties(data);
      // mixpanel.people.set(data);
      
      console.log('✅ Super properties updated');
      
    } catch (error) {
      console.error('❌ Failed to update super properties:', error);
    }
  };

  handleUserReset = (data: any) => {
    console.log('🔄 Processing User Reset');
    
    try {
      // Reset user session in your analytics
      // analytics().reset();
      // mixpanel.reset();
      
      // Clear any user-specific data in your app
      // this.clearUserData();
      
      console.log('✅ User reset processed');
      
    } catch (error) {
      console.error('❌ Failed to process user reset:', error);
    }
  };

  handleUserIdentify = (data: any) => {
    console.log('👤 Processing User Identify:', data);
    
    try {
      const userId = data.userId || data.id;
      const userProperties = data.properties || data.traits || {};
      
      // Identify user in your analytics
      // analytics().identify(userId, userProperties);
      // mixpanel.identify(userId);
      // mixpanel.people.set(userProperties);
      
      console.log('✅ User identified:', { userId, userProperties });
      
    } catch (error) {
      console.error('❌ Failed to identify user:', error);
    }
  };

  handleTransactionSuccess = (data: any) => {
    console.log('✅ Processing Transaction Success:', data);
    
    try {
      // Handle successful transaction
      const transactionId = data.transactionId || data.id;
      const amount = data.amount;
      const broker = data.broker;
      
      // Track successful transaction
      // analytics().logEvent('transaction_success', {
      //   transaction_id: transactionId,
      //   amount: amount,
      //   broker: broker,
      //   timestamp: Date.now()
      // });
      
      // Show success message to user
      // this.showSuccessMessage(`Transaction ${transactionId} completed successfully!`);
      
      // Update UI state
      // this.setState({ lastTransactionStatus: 'success' });
      
      console.log('✅ Transaction success processed');
      
    } catch (error) {
      console.error('❌ Failed to process transaction success:', error);
    }
  };

  handleTransactionFailure = (data: any) => {
    console.log('❌ Processing Transaction Failure:', data);
    
    try {
      // Handle failed transaction
      const transactionId = data.transactionId || data.id;
      const error = data.error || data.errorMessage;
      const errorCode = data.errorCode;
      
      // Track failed transaction
      // analytics().logEvent('transaction_failed', {
      //   transaction_id: transactionId,
      //   error: error,
      //   error_code: errorCode,
      //   timestamp: Date.now()
      // });
      
      // Show error message to user
      // this.showErrorMessage(`Transaction failed: ${error}`);
      
      // Update UI state
      // this.setState({ lastTransactionStatus: 'failed', lastError: error });
      
      console.log('✅ Transaction failure processed');
      
    } catch (error) {
      console.error('❌ Failed to process transaction failure:', error);
    }
  };

  handleLeadGenSuccess = (data: any) => {
    console.log('✅ Processing Lead Gen Success:', data);
    
    try {
      // Handle successful lead generation
      const leadId = data.leadId || data.id;
      const broker = data.broker;
      const userDetails = data.userDetails || {};
      
      // Track successful lead generation
      // analytics().logEvent('leadgen_success', {
      //   lead_id: leadId,
      //   broker: broker,
      //   user_email: userDetails.email,
      //   timestamp: Date.now()
      // });
      
      // Show success message
      // this.showSuccessMessage('Account creation successful!');
      
      // Navigate to next screen or update state
      // this.setState({ isLeadGenComplete: true });
      
      console.log('✅ Lead gen success processed');
      
    } catch (error) {
      console.error('❌ Failed to process lead gen success:', error);
    }
  };

  handleLeadGenFailure = (data: any) => {
    console.log('❌ Processing Lead Gen Failure:', data);
    
    try {
      // Handle failed lead generation
      const error = data.error || data.errorMessage;
      const errorCode = data.errorCode;
      
      // Track failed lead generation
      // analytics().logEvent('leadgen_failed', {
      //   error: error,
      //   error_code: errorCode,
      //   timestamp: Date.now()
      // });
      
      // Show error message with retry option
      // this.showErrorMessage(`Account creation failed: ${error}`, true);
      
      console.log('✅ Lead gen failure processed');
      
    } catch (error) {
      console.error('❌ Failed to process lead gen failure:', error);
    }
  };

  handleUnknownEvent = (event: any) => {
    console.log('🔍 Processing Unknown Event:', event);
    
    // Log unknown gatewayEvents for debugging
    // analytics().logEvent('unknown_scgateway_event', {
    //   event_type: event.type,
    //   event_data: JSON.stringify(event.data),
    //   timestamp: Date.now()
    // });
  };

  // Helper methods (implement these based on your UI framework)
  showSuccessMessage = (message: string) => {
    console.log('✅ Success:', message);
    // Implement toast/alert/snackbar here
    // Toast.show({ text: message, type: 'success' });
  };

  showErrorMessage = (message: string, showRetry = false) => {
    console.log('❌ Error:', message);
    // Implement toast/alert/snackbar here
    // Toast.show({ text: message, type: 'error' });
    // if (showRetry) {
    //   // Show retry button
    // }
  };

  render() {
    const { isSdkInitialized, sdkVersion, lastEvent, lastLoansEvent } = this.state;
    
    return (
      <KeyboardAvoidingView
        enabled={RNPlatform.OS === 'ios'}
        style={{ flex: 1 }}
        behavior="padding"
      >
        <NavigationContainer>
          <SafeAreaProvider>
            <EnvProvider>
              <SstCartProvider>
                <Tab.Navigator>
                  <Tab.Screen name="Connect" component={ConnectScreenStack} />
                  <Tab.Screen name="Sst" component={SstScreen} />
                  <Tab.Screen name="Smt" component={SmtScreen} />
                  <Tab.Screen name="Holdings" component={HoldingsScreenStack} />
                  <Tab.Screen name="LeadGen" component={LeadGenScreen} />
                </Tab.Navigator>
              </SstCartProvider>
            </EnvProvider>
          </SafeAreaProvider>
        </NavigationContainer>
      </KeyboardAvoidingView>
    );
  }
}

export default App;