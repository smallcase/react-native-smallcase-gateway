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
  console.log('🎯 Setting up simplified event listeners... Platform:', RNPlatform.OS);
  this.setupGatewayEventListeners();
  // this.setupLoansEventListeners();
  console.log('✅ Event listeners setup complete');
};

// Fixed Event Listener Setup with proper error handling and event structure

setupGatewayEventListeners = () => {
  console.log('🎯 Setting up unified Gateway event listeners...');
  
  try {
    const gatewaySubscription = SmallcaseGateway.startGatewayEventListening((eventData) => {
      console.log('[App] <- Gateway event received:', eventData);
      
      // Safely extract event type with fallbacks
      const eventType = eventData?.eventType || eventData?.type || 'unknown_event';
      
    });
    
    if (gatewaySubscription) {
      // Store subscription for cleanup
      this.legacyEventSubscriptions = this.legacyEventSubscriptions || [];
      this.legacyEventSubscriptions.push(gatewaySubscription);
      console.log('✅ Gateway event listeners setup complete');
    } else {
      console.warn('⚠️ Failed to create gateway subscription');
    }
    
  } catch (error) {
    console.error('❌ Failed to setup gateway event listeners:', error);
    
    // Optionally show user-friendly error
    this.setState({
      lastError: {
        message: 'Failed to initialize event listeners',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
};




// Cleanup method for component unmount
cleanupEventListeners = () => {
  try {
    if (this.legacyEventSubscriptions) {
      this.legacyEventSubscriptions.forEach(subscription => {
        if (subscription && typeof subscription.remove === 'function') {
          subscription.remove();
        } else if (SmallcaseGateway.unsubscribeFromGatewayEvent) {
          SmallcaseGateway.unsubscribeFromGatewayEvent(subscription);
        }
      });
      
      this.legacyEventSubscriptions = [];
    }
    
    // Clean up the gateway event manager
    if (SmallcaseGateway.cleanupGatewayEvents) {
      SmallcaseGateway.cleanupGatewayEvents();
    }
    
    console.log('✅ Event listeners cleaned up successfully');
    
  } catch (error) {
    console.error('❌ Error cleaning up event listeners:', error);
  }
};

// // 🏦 Unified Loans Event Listener (works for both iOS and Android)
// setupLoansEventListeners = () => {
//   console.log('🏦 Setting up unified Loans event listeners...');
  
//   const loansSubscription = ScLoan.subscribeToLoansEvent('scloans_notification', (eventData) => {
//     console.log('[App] <- Loans event received:', eventData);
    
//     // Update state with the latest loans event
//     this.setState({ 
//       lastLoansEvent: eventData 
//     });
    
//     // Handle different event types based on eventData.type or eventData.eventType
//     const eventType = eventData.type || eventData.eventType;
    
//     switch(eventType) {
//       case ScLoan.loansEventTypes.LOAN_APPLICATION_STARTED:
//       case 'scloans_loan_application_started':
//         console.log('[App] <- Loan application started:', eventData);
//         this.handleSCLoansLoanApplicationStarted(eventData);
//         break;
        
//       case ScLoan.loansEventTypes.LOAN_APPLICATION_COMPLETED:
//       case 'scloans_loan_application_completed':
//         console.log('[App] <- Loan application completed:', eventData);
//         this.handleSCLoansLoanApplicationCompleted(eventData);
//         break;
        
//       case ScLoan.loansEventTypes.LOAN_APPLICATION_FAILED:
//       case 'scloans_loan_application_failed':
//         console.log('[App] <- Loan application failed:', eventData);
//         this.handleSCLoansLoanApplicationFailed(eventData);
//         break;
        
//       case ScLoan.loansEventTypes.LOAN_STATUS_UPDATED:
//       case 'scloans_loan_status_updated':
//         console.log('[App] <- Loan status updated:', eventData);
//         this.handleSCLoansLoanStatusUpdated(eventData);
//         break;
        
//       case ScLoan.loansEventTypes.ANALYTICS_EVENT:
//       case 'scloans_analytics_event':
//         console.log('[App] <- Loans analytics event:', eventData);
//         this.handleSCLoansAnalyticsEvent(eventData);
//         break;
        
//       case ScLoan.loansEventTypes.SUPER_PROPS_UPDATED:
//       case 'scloans_super_properties_updated':
//         console.log('[App] <- Loans super properties updated:', eventData);
//         this.handleSCLoansSuperPropsUpdated(eventData);
//         break;
        
//       default:
//         console.log('[App] <- Unknown loans event type:', eventType, eventData);
//         this.handleUnknownLoansEvent(eventData);
//     }
//   });
  
//   // Store subscription for cleanup
//   this.loansEventSubscriptions.push(loansSubscription);
  
//   console.log('✅ Loans event listeners setup complete');
// };

// 🧹 Updated cleanup method
cleanupAllEventListeners = () => {
  console.log('🧹 Cleaning up all event listeners...');
  
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
  
  // Stop event managers
  SmallcaseGateway.stopGatewayEventListening();
  // ScLoan.cleanupLoansEvents();
    
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