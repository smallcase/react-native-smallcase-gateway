/* eslint-disable react-native/no-inline-styles */
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React, {useContext, useState} from 'react';
import {Button, Switch, SwitchChangeEvent, Text, View} from 'react-native';
import {
  importHoldings,
  showHoldings,
  fetchFunds,
  authorizeHoldings,
  showHoldingsV2,
  reconcileHoldings,
} from '../apis/Functions';
import {UserHoldingsScreen} from '../components/HoldingsList';
import {EnvContext} from '../EnvProvider';
import {MFHoldingsScreen} from './MFHoldingsScreen';
import {MutualFundsScreen} from './MutualFundsScreen';
import * as Sentry from '@sentry/react-native';

interface MyButtonProps {
  onPress: () => void;
  title: string;
}

interface SmartSwitchProps {
  title: string;
  enabled?: boolean;
  onChange?:
    | ((event: SwitchChangeEvent) => void | Promise<void>)
    | null
    | undefined;
}
class SmartButton extends React.Component<MyButtonProps, {}> {
  constructor(props: MyButtonProps) {
    super(props);
  }
  render() {
    return (
      <View
        style={{
          padding: 12,
        }}>
        <Button onPress={this.props.onPress} title={this.props.title} />
      </View>
    );
  } //end render.
}
class SmartSwitch extends React.Component<SmartSwitchProps, {}> {
  constructor(props: SmartSwitchProps) {
    super(props);
  }
  render() {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: 12,
        }}>
        <Text>{this.props.title}</Text>
        <Switch value={this.props.enabled} onChange={this.props.onChange} />
      </View>
    );
  } //end render.
}

const Stack = createNativeStackNavigator();

const HoldingsScreenStack = () => {
  return (
    <NavigationContainer independent={true}>
      <Stack.Navigator>
        <Stack.Screen name="HoldingsScreen" component={HoldingsScreen} />
        <Stack.Screen
          name="UserHoldingsScreen"
          component={UserHoldingsScreen}
        />
        <Stack.Screen name="MutualFundsScreen" component={MutualFundsScreen} />
        <Stack.Screen name="MFHoldingsScreen" component={MFHoldingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
const HoldingsScreen = ({navigation}: {navigation: any}) => {
  const state = useContext(EnvContext);
  const env = state.env;
  const [funds, setFunds] = useState<number | null>(null);
  const [mfEnabled, setMfEnabled] = useState(false);
  const [v2Enabled, setv2Enabled] = useState(false);
  return (
    <View
      style={{
        padding: 12,
        justifyContent: 'space-around',
      }}>
      <SmartSwitch
        title="v2"
        enabled={v2Enabled}
        onChange={event => {
          setv2Enabled(event.nativeEvent.value);
          console.log(event.nativeEvent);
        }}
      />
      <SmartSwitch
        title="Include Mutual Funds"
        enabled={mfEnabled}
        onChange={event => {
          setMfEnabled(event.nativeEvent.value);
          console.log(event.nativeEvent);
        }}
      />
      <SmartButton
        onPress={async () => {
          try {
            authorizeHoldings(env, state.userId);
          } catch (error) {
            Sentry.captureException(error);
            console.log(`Authorize Holdings error -> ${error}`);
          }
        }}
        title={'Authorize Holdings'}
      />
      <SmartButton
        onPress={async () => {
          const assetConfig = {
            mfHoldings: mfEnabled,
          };
          try {
            importHoldings(env, state.userId, assetConfig);
          } catch (error) {
            Sentry.captureException(error);
            console.log(`Import Holdings error -> ${error}`);
          }
        }}
        title={'Import Holdings'}
      />
      <SmartButton
        onPress={async () => {
          try {
            const v1 = showHoldings(state.env, state.userId, mfEnabled);
            const v2 = showHoldingsV2(state.env, state.userId, mfEnabled);
            const holdingsRes = await (v2Enabled ? v2 : v1);
            state.setHoldings(holdingsRes);
            // console.log('Show Holdings res: ' + JSON.stringify(state.holdings));
            navigation.navigate('UserHoldingsScreen', {
              version: v2Enabled ? 2 : 1,
            });
          } catch (error) {
            Sentry.captureException(error);
            console.log(`Show Holdings error: ${error}`);
          }
        }}
        title={'Show Holdings'}
      />
      <SmartButton
        onPress={async () => {
          try {
            reconcileHoldings(state.env, state.userId);
          } catch (error) {
            Sentry.captureException(error);
            console.log(`Reconcile Holdings error: ${error}`);
          }
        }}
        title={'Reconcile Holdings'}
      />
      <Text>{funds?.toString() ?? ''}</Text>
      <SmartButton
        onPress={async () => {
          const fundsRes = await fetchFunds(env, state.userId);
          console.log(`fundsRes on screen = ${fundsRes}`);
          setFunds(fundsRes);
        }}
        title={'Fetch Funds'}
      />
      <SmartButton
        onPress={async () => {
          navigation.navigate('MFHoldingsScreen');
        }}
        title={'MF Holdings'}
      />
    </View>
  );
};
export {HoldingsScreen, HoldingsScreenStack, SmartButton};
export type {MyButtonProps};
