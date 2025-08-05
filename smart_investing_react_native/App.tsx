import React from 'react';
import SmallcaseGateway from 'react-native-smallcase-gateway';
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
}

interface AppProps {
  [key: string]: any;
}

class App extends React.Component<AppProps, AppState> {
  private eventSubscription: any = null;
  private legacyEventSubscriptions: any[] = [];

  constructor(props: AppProps) {
    super(props);
    this.state = {
      isSdkInitialized: false,
      sdkVersion: null,
      lastEvent: null
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
    console.log('🎯 Setting up event listeners...');
    
    // Platform-specific event handling
    if (RNPlatform.OS === 'ios') {
      this.setupIOSEventListeners();
    } else {
      this.setupAndroidEventListeners();
    }
    
    // Also setup legacy event listeners for backward compatibility
    this.setupLegacyEventListeners();
    
    console.log('✅ Event listeners setup complete');
  };

  setupIOSEventListeners = () => {
    console.log('🍎 Setting up iOS-specific event listeners...');
    
    // Use the legacy event manager for iOS-specific events
    const { eventManager, events } = SmallcaseGateway as any;
    
    // Start listening to iOS events
    eventManager.startListening().then(() => {
      console.log('✅ iOS event manager started listening');
    }).catch((error: any) => {
      console.error('❌ Failed to start iOS event manager:', error);
    });
    
    // Add listeners for iOS-specific events
    const analyticsSubscription = events.onAnalyticsEvent((data: any) => {
      console.log('📊 iOS Analytics Event:', data);
      this.handleAnalyticsEvent(data);
    });
    
    const superPropsSubscription = events.onSuperPropertiesUpdated((data: any) => {
      console.log('🔄 iOS Super Properties Updated:', data);
      this.handleSuperPropsUpdated(data);
    });
    
    const userResetSubscription = events.onUserReset((data: any) => {
      console.log('🔄 iOS User Reset:', data);
      this.handleUserReset(data);
    });
    
    const userIdentifySubscription = events.onUserIdentify((data: any) => {
      console.log('👤 iOS User Identify:', data);
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

  setupAndroidEventListeners = () => {
    console.log('🤖 Setting up Android event listeners...');
    
    // Use the main event listener for Android
    this.eventSubscription = (SmallcaseGateway as any).addEventsListener((event: any) => {
      console.log('\n🎉 === Android SmallcaseGateway Event Received ===');
      console.log('Event Type:', event.type);
      console.log('Event Data:', event.data);
      console.log('Timestamp:', new Date().toISOString());
      
      this.setState({ lastEvent: event });
      
      // Handle different event types
      switch (event.type) {
        case (SmallcaseGateway as any).eventTypes.ANALYTICS_EVENT:
          this.handleAnalyticsEvent(event.data);
          break;
          
        case (SmallcaseGateway as any).eventTypes.SUPER_PROPS_UPDATED:
          this.handleSuperPropsUpdated(event.data);
          break;
          
        case (SmallcaseGateway as any).eventTypes.USER_RESET:
          this.handleUserReset(event.data);
          break;
          
        case (SmallcaseGateway as any).eventTypes.USER_IDENTIFY:
          this.handleUserIdentify(event.data);
          break;
          
        case (SmallcaseGateway as any).eventTypes.TRANSACTION_SUCCESS:
          this.handleTransactionSuccess(event.data);
          break;
          
        case (SmallcaseGateway as any).eventTypes.TRANSACTION_FAILED:
          this.handleTransactionFailure(event.data);
          break;
          
        case (SmallcaseGateway as any).eventTypes.LEADGEN_SUCCESS:
          this.handleLeadGenSuccess(event.data);
          break;
          
        case (SmallcaseGateway as any).eventTypes.LEADGEN_FAILED:
          this.handleLeadGenFailure(event.data);
          break;
          
        default:
          console.log('🔍 Unknown event type:', event.type, 'Data:', event.data);
          this.handleUnknownEvent(event);
      }
      
      console.log('=== End Android SmallcaseGateway Event ===\n');
    });
  };

  setupLegacyEventListeners = () => {
    console.log('🔄 Setting up legacy event listeners for cross-platform compatibility...');
    
    // Add a general event listener that works on both platforms
    const generalSubscription = (SmallcaseGateway as any).addEventsListener((event: any) => {
      console.log('\n🎉 === General SmallcaseGateway Event Received ===');
      console.log('Platform:', RNPlatform.OS);
      console.log('Event Type:', event.type);
      console.log('Event Data:', event.data);
      console.log('Timestamp:', new Date().toISOString());
      
      this.setState({ lastEvent: event });
      
      // Handle events regardless of platform
      this.handleGeneralEvent(event);
      
      console.log('=== End General SmallcaseGateway Event ===\n');
    });
    
    this.legacyEventSubscriptions.push(generalSubscription);
  };

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
    
    // Stop iOS event manager if running
    if (RNPlatform.OS === 'ios') {
      const { eventManager } = SmallcaseGateway as any;
      eventManager.stopListening().catch(console.error);
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

  // Event Handlers
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
      
      console.log('✅ Analytics event processed:', { eventName, properties });
      
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
    
    // Log unknown events for debugging
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
    const { isSdkInitialized, sdkVersion, lastEvent } = this.state;
    
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