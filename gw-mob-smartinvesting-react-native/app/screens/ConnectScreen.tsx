import SegmentedControl from '@react-native-segmented-control/segmented-control';
import React, {useContext, useState} from 'react';
import {Button, ScrollView, Switch, Text, TextInput, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  connect,
  copyToClipboard,
  getGatewayEnvFromIndex,
  setEnvironment,
  showToast,
  triggerTxn,
} from '../apis/Functions';
import {Environment, getLatestTxnId} from '../apis/SmartInvestingService';
import {EnvContext} from '../EnvProvider';
import {getSdkVersion} from '../apis/Functions';
import {name as app_name, version as app_version} from '../../package.json';
import {LoansScreen} from './LoansScreen';
import {SmartButton} from './HoldingsScreen';
import {LoansCreateUserScreen} from './LoansUserScreen';

const prodEnv: Environment = {
  name: 'Prod',
  baseUrl: 'https://api.smartinvesting.io/',
  gatewayName: 'gatewaydemo',
  index: 0,
};
const devEnv: Environment = {
  name: 'Dev',
  baseUrl: 'https://api.dev.smartinvesting.io/',
  gatewayName: 'gatewaydemo-dev',
  index: 1,
};
const stagEnv: Environment = {
  name: 'Staging',
  baseUrl: 'https://api-stag.smartinvesting.io/',
  gatewayName: 'gatewaydemo-stag',
  index: 2,
};

function _getEnvFromIndex(envIndex: number): Environment {
  switch (envIndex) {
    case 1:
      return devEnv;
    case 2:
      return stagEnv;
    default:
      return prodEnv;
  }
}

const Stack = createNativeStackNavigator();

const ConnectScreenStack = () => {
  return (
    <NavigationContainer independent={true}>
      <Stack.Navigator>
        <Stack.Screen name="ConnectScreen" component={ConnectScreen} />
        <Stack.Screen name="LoansScreen" component={LoansScreen} />
        <Stack.Screen
          name="LoansUserScreen"
          component={LoansCreateUserScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const ConnectScreen = ({navigation}) => {
  const state = useContext(EnvContext);
  const [isLeprechaun, setLeprechaun] = useState(true);
  const [isAmo, setAmo] = useState(true);
  const [gatewayName, setGatewayName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [jwt, setJwt] = useState<string | null>(null);
  let txnId = '';

  return (
    <ScrollView
      style={{
        padding: 12,
      }}>
      <Text> {app_name + ': ' + app_version}</Text>
      <SdkVersionComponent />

      <Text>Environment</Text>
      <SegmentedControl
        values={['Prod', 'Dev', 'Staging']}
        selectedIndex={state.env.index}
        onChange={event => {
          state.setEnv(
            _getEnvFromIndex(event.nativeEvent.selectedSegmentIndex),
          );
        }}
      />
      <TextInput
        placeholder="Enter gateway name. Defaults to : gatewaydemo"
        style={{
          borderColor: 'skyblue',
          borderWidth: 1,
          borderRadius: 12,
          marginVertical: 12,
        }}
        onChangeText={setGatewayName}
      />
      <SmartButton
        title="Loans"
        onPress={() => {
          let gwName: string | null = gatewayName;
          if (gatewayName.length === 0) {
            gwName = null;
          }
          const config = {
            gatewayName: gwName ?? state.env.gatewayName,
            environment: getGatewayEnvFromIndex(state.env.index),
          };
          console.log(`ScLoan config: ${JSON.stringify(config)}`);

          navigation.navigate('LoansScreen', {
            config: config,
          });
        }}
      />
      <TextInput
        placeholder="Enter custom JWT"
        style={{
          borderColor: 'skyblue',
          borderWidth: 1,
          borderRadius: 12,
          marginVertical: 12,
        }}
        onChangeText={setJwt}
      />
      <TextInput
        placeholder="Enter user id"
        style={{
          borderColor: 'skyblue',
          borderWidth: 1,
          borderRadius: 12,
          marginVertical: 12,
        }}
        onChangeText={state.setUserId}
      />
      <View
        style={{
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Text>Leprechaun Mode</Text>
        <Switch
          value={isLeprechaun}
          onChange={event => {
            setLeprechaun(event.nativeEvent.value);
            console.log(event.nativeEvent);
          }}
        />
      </View>
      <View
        style={{
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <Text>Amo Mode</Text>
        <Switch
          value={isAmo}
          onChange={event => {
            setAmo(event.nativeEvent.value);
            console.log(event.nativeEvent);
          }}
        />
      </View>
      <View
        style={{
          padding: 12,
        }}>
        <Button
          onPress={async () => {
            let gwName: string | null = gatewayName;
            if (gatewayName.length === 0) {
              gwName = null;
            }
            const connected = await setEnvironment(
              state.env,
              gwName,
              state.userId,
              isLeprechaun,
              isAmo,
              jwt,
            );
            state.setIsConnected(connected);
          }}
          title="Setup"
          accessibilityLabel="Learn more about this purple button"
        />
      </View>
      <View
        style={{
          padding: 12,
        }}>
        {isConnecting ? (
          <Text>Connecting...</Text>
        ) : (
          <Button
            onPress={async () => {
              if (state.isConnected) {
                showToast('User is already connected');
                return;
              }
              setIsConnecting(true);
              const res = await connect(state.env, state.userId);
              setIsConnecting(false);
            }}
            title={`Connect to ${state.env.name}`}
            accessibilityLabel="Learn more about this purple button"
          />
        )}
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <TextInput
          placeholder="Enter transaction Id"
          style={{
            flex: 1,
            borderColor: 'skyblue',
            borderWidth: 1,
            borderRadius: 12,
            marginVertical: 12,
            marginEnd: 12,
          }}
          onChangeText={value => (txnId = value)}
        />
        <Button
          onPress={async () => {
            triggerTxn(txnId);
          }}
          title={'Trigger'}
        />
      </View>
      <Button
        onPress={async () => {
          copyToClipboard(getLatestTxnId());
        }}
        title={'Copy transaction Id'}
        accessibilityLabel="Learn more about this purple button"
      />
    </ScrollView>
  );
};

const SdkVersionComponent = ({}) => {
  const [sdk, setSdk] = useState<any | null>(null);
  init();
  async function init() {
    const val = await getSdkVersion();
    setSdk(val);
  }
  return <Text> {'Sdk version' + ': ' + sdk ?? ''}</Text>;
};

export {ConnectScreenStack, ConnectScreen, prodEnv};
