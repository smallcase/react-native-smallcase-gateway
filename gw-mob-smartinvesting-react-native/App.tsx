/* eslint-disable prettier/prettier */
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, { useState } from 'react';

// todo : add to doc - syntax for typescript

import { NavigationContainer } from '@react-navigation/native';
// import {createNativeStackNavigator} from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SstScreen } from './app/screens/SstScreen';
import { ConnectScreenStack } from './app/screens/ConnectScreen';
import { EnvProvider } from './app/EnvProvider';
import { SmtScreen } from './app/screens/SmtScreen';
import { HoldingsScreenStack } from './app/screens/HoldingsScreen';
import { LeadGenScreen } from './app/screens/LeadGenScreen';
import { SstCartProvider } from './app/SstCartProvider';
import { KeyboardAvoidingView, Platform, Text } from 'react-native';
import { getSdkVersion } from './app/apis/Functions';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native'; 

// const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

Sentry.init({
  dsn: 'https://6ecea4fc9ee8431d8d07e05559500120@sentry.smallcase.com/104',
  debug: true,
  environment: 'staging',
});
Sentry.setTag('source', 'react-native-smartinvesting-app');

const App = () => {
  return (
    <KeyboardAvoidingView enabled={Platform.OS === 'ios' ? true : false} style={{flex: 1}} behavior="padding">
      <NavigationContainer>
        <SafeAreaProvider>
        <EnvProvider>
        <SstCartProvider>
          {/* <Text>   {app_name + ': ' + app_version}</Text>
          <SdkVersionComponent /> */}
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

const SdkVersionComponent = ({ }) => {
  const [sdk, setSdk] = useState<any | null>(null);
  init();
  async function init() {
    const val = await getSdkVersion();
    setSdk(val);
  }
  return (<Text>   {'Sdk version' + ': ' + sdk ?? ''}</Text>);
};

export default App;
function useEffect(arg0: () => void, arg1: never[]) {
  throw new Error('Function not implemented.');
}

