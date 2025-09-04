import React from 'react';
import SmallcaseGateway, {ScLoan} from 'react-native-smallcase-gateway';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {KeyboardAvoidingView, Platform as RNPlatform} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

// Your screen imports
import {SstScreen} from './app/screens/SstScreen';
import {ConnectScreenStack} from './app/screens/ConnectScreen';
import {EnvProvider} from './app/EnvProvider';
import {SmtScreen} from './app/screens/SmtScreen';
import {HoldingsScreenStack} from './app/screens/HoldingsScreen';
import {LeadGenScreen} from './app/screens/LeadGenScreen';
import {SstCartProvider} from './app/SstCartProvider';

const Tab = createBottomTabNavigator();

interface AppState {
  isSdkInitialized: boolean;
  sdkVersion: string | null;
  lastEvent: any | null;
  lastLoansEvent: any | null;
  lastError: any | null;
}

interface AppProps {
  [key: string]: any;
}

class App extends React.Component<AppProps, AppState> {
  private gatewaySubscriptions: any[] = [];
  private loansSubscriptions: any[] = [];

  constructor(props: AppProps) {
    super(props);
    this.state = {
      isSdkInitialized: false,
      sdkVersion: null,
      lastEvent: null,
      lastLoansEvent: null,
      lastError: null,
    };
  }

  componentDidMount() {
    console.log('App mounted - Initializing SmallcaseGateway SDK');
    this.initializeSDK();
  }

  componentWillUnmount() {
    console.log('App unmounting - Cleaning up all event listeners');
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
        environmentName: 'development', // Change to 'production' for production
      });

      console.log('Configuration set successfully');

      // Get SDK version
      const sdkVersion = await SmallcaseGateway.getSdkVersion();
      console.log('SDK Version:', sdkVersion);

      // Setup event listeners after SDK is initialized
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize SDK:', error);
    }
  };

  setupEventListeners = () => {
    console.log('🎯 Setting up event listeners... Platform:', RNPlatform.OS);
    this.setupGatewayEventListeners();
    this.setupLoansEventListeners();
    console.log('Event listeners setup complete');
  };

  setupGatewayEventListeners = () => {
    console.log('Setting up Gateway event listeners...');

    try {
      const gatewaySubscription = SmallcaseGateway.subscribeToGatewayEvents(
        eventData => {
          console.log('[Gateway Event]:', eventData);

          // Safely extract event type with fallbacks
          const eventType =
            eventData?.eventType || eventData?.type || 'unknown_event';


          // Handle specific event types
          // this.handleGatewayEvent(eventType, eventData);
        },
      );

      if (gatewaySubscription) {
        this.gatewaySubscriptions.push(gatewaySubscription);
        console.log('Gateway event subscription created');
      } else {
        console.warn('Failed to create gateway subscription');
      }
    } catch (error) {
      console.error('Failed to setup gateway event listeners:', error);
    }
  };

  setupLoansEventListeners = () => {
    console.log('💰 Setting up Loans event listeners...');

    try {
      const loansSubscription = ScLoan.subscribeToLoansEvent(eventData => {
        console.log('[Loans Event]:', eventData);

        // Handle different event types based on eventData.type or eventData.eventType
        const eventType =
          eventData?.eventType || eventData?.type || 'unknown_loans_event';

        // Handle specific loans event types
        // this.handleLoansEvent(eventType, eventData);
      });

      if (loansSubscription) {
        this.loansSubscriptions.push(loansSubscription);
        console.log('Loans event subscription created');
      } else {
        console.warn('Failed to create loans subscription');
      }
    } catch (error) {
      console.error('Failed to setup loans event listeners:', error);
    }
  };

  // Comprehensive cleanup method
  cleanupAllEventListeners = () => {
    try {
      console.log('🧹 Starting comprehensive event cleanup...');

      // Cleanup Gateway subscriptions
      if (this.gatewaySubscriptions.length > 0) {
        this.gatewaySubscriptions.forEach((subscription, index) => {
          try {
            if (subscription?.remove) {
              subscription.remove();
            } else if (SmallcaseGateway.unsubscribeFromGatewayEvents) {
              SmallcaseGateway.unsubscribeFromGatewayEvents(subscription);
            }
          } catch (subError) {
            console.warn(
              `Error removing gateway subscription ${index}:`,
              subError,
            );
          }
        });

        this.gatewaySubscriptions = [];
        console.log('Gateway subscriptions cleaned up');
      }

      // Cleanup Loans subscriptions
      if (this.loansSubscriptions.length > 0) {
        this.loansSubscriptions.forEach((subscription, index) => {
          try {
            if (subscription?.remove) {
              subscription.remove();
            } else if (ScLoan.unsubscribeFromLoansEvent) {
              ScLoan.unsubscribeFromLoansEvent(subscription);
            }
          } catch (subError) {
            console.warn(
              `Error removing loans subscription ${index}:`,
              subError,
            );
          }
        });

        this.loansSubscriptions = [];
        console.log('Loans subscriptions cleaned up');
      }

      console.log('All event listeners cleaned up successfully');
    } catch (error) {
      console.error('Error during cleanup:', error);

      // Force cleanup arrays even on error
      this.gatewaySubscriptions = [];
      this.loansSubscriptions = [];
    }
  };

  // Helper methods for user feedback
  showSuccessMessage = (message: string) => {
    console.log('Success:', message);
    // TODO: Implement toast/alert/snackbar here
    // Toast.show({ text: message, type: 'success' });
  };

  showErrorMessage = (message: string, showRetry = false) => {
    console.error('Error:', message);
    // TODO: Implement toast/alert/snackbar here
    // Toast.show({ text: message, type: 'error' });
    // if (showRetry) {
    //   // Show retry button/option
    // }
  };

  render() {
    const {isSdkInitialized, sdkVersion, lastEvent, lastLoansEvent, lastError} =
      this.state;

    // You can conditionally render based on SDK initialization status
    if (!isSdkInitialized && !lastError) {
      // TODO: Show loading screen while SDK initializes
      console.log('SDK still initializing...');
    }

    if (lastError) {
      // TODO: Show error screen with retry option
      console.log('SDK initialization error:', lastError);
    }

    return (
      <KeyboardAvoidingView
        enabled={RNPlatform.OS === 'ios'}
        style={{flex: 1}}
        behavior="padding">
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
