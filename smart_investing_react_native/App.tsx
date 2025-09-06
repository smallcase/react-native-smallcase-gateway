import React, { useState, useEffect, useRef, useCallback } from 'react';
import SmallcaseGateway from 'react-native-smallcase-gateway';
import { SCGatewayEventManager, SCLoansEventManager } from 'react-native-smallcase-gateway';
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

interface AppProps {
  [key: string]: any;
}

const App: React.FC<AppProps> = (props) => {
  // State hooks
  const [isSdkInitialized, setIsSdkInitialized] = useState<boolean>(false);
  const [sdkVersion, setSdkVersion] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<any | null>(null);
  const [lastLoansEvent, setLastLoansEvent] = useState<any | null>(null);
  const [lastError, setLastError] = useState<any | null>(null);

  // Refs for subscription arrays
  const gatewaySubscriptions = useRef<any[]>([]);
  const loansSubscriptions = useRef<any[]>([]);

  const initializeSDK = useCallback(async () => {
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
      const version = await SmallcaseGateway.getSdkVersion();
      console.log('SDK Version:', version);
      setSdkVersion(version);

      // Setup event listeners after SDK is initialized
      setupEventListeners();
      setIsSdkInitialized(true);
    } catch (error) {
      console.error('Failed to initialize SDK:', error);
      setLastError(error);
    }
  }, []);

  const setupEventListeners = useCallback(() => {
    console.log('🎯 Setting up event listeners... Platform:', RNPlatform.OS);
    setupGatewayEventListeners();
    setupLoansEventListeners();
    console.log('Event listeners setup complete');
  }, []);

  const setupGatewayEventListeners = useCallback(() => {
    console.log('Setting up Gateway event listeners...');

    try {
      const gatewaySubscription =
        SCGatewayEventManager.subscribeToGatewayEvents((eventData: any) => {
          console.log('[Gateway Event]:', eventData);
          setLastEvent(eventData);

          // Safely extract event type with fallbacks
          const eventType =
            eventData?.eventType || eventData?.type || 'unknown_event';

          // Handle specific event types
          // handleGatewayEvent(eventType, eventData);
        });

      if (gatewaySubscription) {
        gatewaySubscriptions.current.push(gatewaySubscription);
        console.log('Gateway event subscription created');
      } else {
        console.warn('Failed to create gateway subscription');
      }
    } catch (error) {
      console.error('Failed to setup gateway event listeners:', error);
    }
  }, []);

  const setupLoansEventListeners = useCallback(() => {
    console.log('💰 Setting up Loans event listeners...');

    try {
      const loansSubscription = SCLoansEventManager.subscribeToLoansEvent(
        (eventData: any) => {
          console.log('[Loans Event]:', eventData);
          setLastLoansEvent(eventData);

          // Handle different event types based on eventData.type or eventData.eventType
          const eventType =
            eventData?.eventType || eventData?.type || 'unknown_loans_event';

          // Handle specific loans event types
          // handleLoansEvent(eventType, eventData);
        },
      );

      if (loansSubscription) {
        loansSubscriptions.current.push(loansSubscription);
        console.log('Loans event subscription created');
      } else {
        console.warn('Failed to create loans subscription');
      }
    } catch (error) {
      console.error('Failed to setup loans event listeners:', error);
    }
  }, []);

  // Comprehensive cleanup method
  const cleanupAllEventListeners = useCallback(() => {
    try {
      console.log('🧹 Starting comprehensive event cleanup...');

      // Cleanup Gateway subscriptions
      if (gatewaySubscriptions.current.length > 0) {
        gatewaySubscriptions.current.forEach((subscription, index) => {
          try {
            if (subscription?.remove) {
              subscription.remove();
            } else if (SCGatewayEventManager.unsubscribeFromGatewayEvents) {
              SCGatewayEventManager.unsubscribeFromGatewayEvents(subscription);
            }
          } catch (subError) {
            console.warn(
              `Error removing gateway subscription ${index}:`,
              subError,
            );
          }
        });

        gatewaySubscriptions.current = [];
        console.log('Gateway subscriptions cleaned up');
      }

      // Cleanup Loans subscriptions
      if (loansSubscriptions.current.length > 0) {
        loansSubscriptions.current.forEach((subscription, index) => {
          try {
            if (subscription?.remove) {
              subscription.remove();
            } else if (SCLoansEventManager.unsubscribeFromLoansEvent) {
              SCLoansEventManager.unsubscribeFromLoansEvent(subscription);
            }
          } catch (subError) {
            console.warn(
              `Error removing loans subscription ${index}:`,
              subError,
            );
          }
        });

        loansSubscriptions.current = [];
        console.log('Loans subscriptions cleaned up');
      }

      console.log('All event listeners cleaned up successfully');
    } catch (error) {
      console.error('Error during cleanup:', error);

      // Force cleanup arrays even on error
      gatewaySubscriptions.current = [];
      loansSubscriptions.current = [];
    }
  }, []);

  // Helper methods for user feedback
  const showSuccessMessage = useCallback((message: string) => {
    console.log('Success:', message);
    // TODO: Implement toast/alert/snackbar here
    // Toast.show({ text: message, type: 'success' });
  }, []);

  const showErrorMessage = useCallback((message: string, showRetry = false) => {
    console.error('Error:', message);
    // TODO: Implement toast/alert/snackbar here
    // Toast.show({ text: message, type: 'error' });
    // if (showRetry) {
    //   // Show retry button/option
    // }
  }, []);

  // useEffect for componentDidMount
  useEffect(() => {
    console.log('App mounted - Initializing SmallcaseGateway SDK');
    initializeSDK();

    // Cleanup function for componentWillUnmount
    return () => {
      console.log('App unmounting - Cleaning up all event listeners');
      cleanupAllEventListeners();
    };
  }, [initializeSDK, cleanupAllEventListeners]);

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
};

export default App;
