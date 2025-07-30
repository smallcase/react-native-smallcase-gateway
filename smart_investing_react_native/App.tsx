/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React from 'react';
import SmallcaseGateway from 'react-native-smallcase-gateway';
import { NativeModules, Platform } from 'react-native';

// todo : add to doc - syntax for typescript

import {NavigationContainer} from '@react-navigation/native';
// import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SstScreen} from './app/screens/SstScreen';
import {ConnectScreenStack} from './app/screens/ConnectScreen';
import {EnvProvider} from './app/EnvProvider';
import {SmtScreen} from './app/screens/SmtScreen';
import {HoldingsScreenStack} from './app/screens/HoldingsScreen';
import {LeadGenScreen} from './app/screens/LeadGenScreen';
import {SstCartProvider} from './app/SstCartProvider';
import {KeyboardAvoidingView, Platform as RNPlatform, Text} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

class App extends React.Component {
  async componentDidMount() {
    // Debug native modules first
    this.debugNativeModules();
    
    // Setup SCGateway event tracking
    this.setupAnalyticsTracking();
  }

  componentWillUnmount() {
    // Cleanup
    try {
      if (SmallcaseGateway.events && SmallcaseGateway.events.stopListening) {
        SmallcaseGateway.events.stopListening();
      }
      
      if (this.analyticsSubscription && this.analyticsSubscription.remove) {
        this.analyticsSubscription.remove();
      }
    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  }

  debugNativeModules = () => {
    console.log('🔍 Debug Info:');
    console.log('Platform:', RNPlatform.OS);
    console.log('SmallcaseGateway available:', !!SmallcaseGateway);
    console.log('SmallcaseGateway.events available:', !!SmallcaseGateway.events);
    console.log('SmallcaseGateway.eventManager available:', !!SmallcaseGateway.eventManager);
    
    // Check native modules
    console.log('Available NativeModules:');
    console.log('- SCGatewayBridgeEmitter:', !!NativeModules.SCGatewayBridgeEmitter);
    console.log('- SmallcaseGateway:', !!NativeModules.SmallcaseGateway);
    
    if (NativeModules.SCGatewayBridgeEmitter) {
      console.log('SCGatewayBridgeEmitter methods:', Object.keys(NativeModules.SCGatewayBridgeEmitter));
    }
    
    // Check SmallcaseGateway structure
    if (SmallcaseGateway) {
      console.log('SmallcaseGateway keys:', Object.keys(SmallcaseGateway));
    }
  };

  setupAnalyticsTracking = async () => {
    try {
      console.log('🚀 Setting up analytics tracking...');
      
      // Check if events are available
      if (!SmallcaseGateway.events) {
        console.error('❌ SmallcaseGateway.events is not available');
        return;
      }
      
      // Debug the events object
      console.log('Events object type:', typeof SmallcaseGateway.events);
      console.log('Events object keys:', Object.keys(SmallcaseGateway.events));
      
      // Try to start listening - use the correct method name
      if (SmallcaseGateway.events.startListening) {
        const result = await SmallcaseGateway.events.startListening();
        console.log('✅ Start listening result:', result);
      } else if (SmallcaseGateway.eventManager && SmallcaseGateway.eventManager.startListening) {
        // Fallback to eventManager if events doesn't have startListening
        const result = await SmallcaseGateway.eventManager.startListening();
        console.log('✅ Start listening via eventManager result:', result);
      } else {
        console.error('❌ No startListening method found');
        return;
      }
      
      // Set up event handlers
      if (SmallcaseGateway.events.onAnalyticsEvent) {
        this.analyticsSubscription = SmallcaseGateway.events.onAnalyticsEvent((eventData) => {
          this.forwardToAnalytics(eventData);
        });
        console.log('✅ Analytics event listener setup complete');
      } else {
        console.error('❌ onAnalyticsEvent method not found');
      }

    } catch (error) {
      console.error('❌ Failed to setup analytics tracking:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
  };

  forwardToAnalytics = (eventData) => {
    try {
      console.log('📊 Received analytics event:', eventData);
      
      // Handle different data formats
      let parsedData = eventData;
      if (typeof eventData.data === 'string') {
        try {
          parsedData.data = JSON.parse(eventData.data);
        } catch (parseError) {
          console.warn('Failed to parse event data:', parseError);
        }
      }
      
      // Extract event name and properties
      const eventName = parsedData.eventName || parsedData.type || 'unknown_event';
      const properties = parsedData.properties || parsedData.data || {};
      
      // Send to your preferred analytics service
      // Example: Firebase Analytics
      // analytics().logEvent(eventName, properties);
      
      // Example: Mixpanel
      // Mixpanel.track(eventName, properties);
      
      // For now, just log it
      console.log('📈 Forwarding to analytics:', { eventName, properties });
      
    } catch (error) {
      console.error('❌ Failed to forward analytics event:', error);
    }
  };

  render() {
    return (
      <KeyboardAvoidingView
        enabled={RNPlatform.OS === 'ios' ? true : false}
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