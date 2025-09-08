import {
  SCGatewayEventManager,
  SCLoansEventManager,
} from 'react-native-smallcase-gateway';
import React, {useEffect} from 'react';
import SmallcaseGateway, {ScLoan} from 'react-native-smallcase-gateway';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {KeyboardAvoidingView, Platform as RNPlatform} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

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

const App: React.FC = () => {
  useEffect(() => {
    initializeSDK();
    return () => {
      SCGatewayEventManager.cleanup();
      SCLoansEventManager.cleanup();
    };
  }, []);

  const initializeSDK = async () => {
    try {
      console.log('Initializing SmallcaseGateway SDK...');

      // Set configuration environment first
      await SmallcaseGateway.setConfigEnvironment({
        gatewayName: 'SmartInvestingApp',
        isLeprechaun: false,
        isAmoEnabled: true,
        brokerList: ['zerodha', 'upstox', 'angelone'],
        environmentName: 'development',
      });

      console.log('Configuration set successfully');

      const sdkVersion = await SmallcaseGateway.getSdkVersion();
      console.log('SDK Version:', sdkVersion);

      const gatewaySubscription =
        SCGatewayEventManager.subscribeToGatewayEvents(eventData => {
          console.log('[Gateway Event]:', eventData);
          const eventType = eventData?.type || 'unknown_event';
          // Handle specific event types
        });

      const loansSubscription = SCLoansEventManager.subscribeToLoansEvent(
        eventData => {
          console.log('[Loans Event]:', eventData);
          const eventType = eventData?.type || 'unknown_loans_event';
          // Handle specific event types
        },
      );
    } catch (error) {
      console.error('Failed to initialize SDK:', error);
    }
  };

  return <Content />;
};

const Content = () => {
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
