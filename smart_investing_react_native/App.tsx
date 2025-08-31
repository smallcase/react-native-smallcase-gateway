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
  this.setupLoansEventListeners();
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

setupLoansEventListeners = () => {
  console.log('Setting up unified Loans event listeners...');
  
  try {
  const loansSubscription = ScLoan.subscribeToLoansEvent((eventData) => {
    console.log('[App] <- Loans event received:', eventData);
    
    // Handle different event types based on eventData.type or eventData.eventType
    const eventType = eventData.type || eventData.eventType;
    
  });
    
    if (loansSubscription) {
      // Store subscription for cleanup
      this.legacyEventSubscriptions = this.legacyEventSubscriptions || [];
      this.legacyEventSubscriptions.push(loansSubscription);
      this.loansEventSubscriptions.push(loansSubscription);
      console.log('Loans event listeners setup complete');
    } else {
      console.warn('Failed to create Loans subscription');
    }
    
  } catch (error) {
    console.error('Failed to setup Loans event listeners:', error);
    
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
  ScLoan.cleanupLoansEvents();
    
  console.log('✅ All event listeners cleaned up');
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