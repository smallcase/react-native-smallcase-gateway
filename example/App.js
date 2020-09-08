import React, {useState, useCallback} from 'react';
import {
  Text,
  View,
  Button,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import SmallcaseGateway from 'react-native-smallcase-gateway';

const GATEWAY_ENV = SmallcaseGateway.ENV;

const App = () => {
  const [log, setLog] = useState('');
  const [env, setEnv] = useState(GATEWAY_ENV.PROD);

  const [sdkToken, setSdkToken] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const updateEnv = useCallback(async () => {
    setLog((p) => p + '\n setting config');

    try {
      await SmallcaseGateway.setConfigEnvironment({
        environmentName: env,
        gatewayName: 'smallcase-website',
        isLeprechaun: true,
        brokerList: ['kite', 'aliceblue', 'trustline'],
      });

      setLog((p) => p + '\n config set successfully');
    } catch (err) {
      setLog((p) => p + '\n error setting config' + err);
    }
  }, [env]);

  const init = useCallback(async () => {
    setLog((p) => p + '\n starting init');
    try {
      await SmallcaseGateway.init(sdkToken);
      setLog((p) => p + '\n init success');
    } catch (err) {
      setLog((p) => p + '\n error during init' + err);
    }
  }, [sdkToken]);

  const startTransaction = useCallback(async () => {
    setLog((p) => p + '\n starting transaction');
    try {
      const res = await SmallcaseGateway.triggerTransaction(transactionId);
      setLog((p) => p + '\n transaction success');
      setLog((p) => p + '\n' + JSON.stringify(res, null, 2));
    } catch (err) {
      setLog((p) => p + '\n error during transaction' + err);
    }
  }, [transactionId]);

  return (
    <ScrollView style={styles.container}>
      <Text>Smallcase SDK Tester</Text>
      <View style={styles.envContainer}>
        <EnvButton
          buttonEnv={GATEWAY_ENV.PROD}
          currentEnv={env}
          onPress={setEnv}
        />
        <EnvButton
          buttonEnv={GATEWAY_ENV.STAG}
          currentEnv={env}
          onPress={setEnv}
        />
        <EnvButton
          buttonEnv={GATEWAY_ENV.DEV}
          currentEnv={env}
          onPress={setEnv}
        />
      </View>
      <Button title="update env" onPress={updateEnv} />
      <TextInput
        value={sdkToken}
        onChangeText={setSdkToken}
        style={styles.inp}
        placeholder="sdk token"
      />
      <Button title="initialize" onPress={init} />
      <TextInput
        value={transactionId}
        onChangeText={setTransactionId}
        style={styles.inp}
        placeholder="transaction id"
      />
      <Button title="start transaction" onPress={startTransaction} />
      <View style={styles.logBox}>
        <Button title="clear logs" onPress={() => setLog('')} />
        <Text>{log}</Text>
      </View>
    </ScrollView>
  );
};

const EnvButton = ({buttonEnv, currentEnv, onPress}) => {
  let color = '#cecece';
  if (currentEnv === buttonEnv) {
    color = '#27BC94';
  }

  return (
    <Button
      color={color}
      title={buttonEnv}
      onPress={() => onPress(buttonEnv)}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  inp: {
    backgroundColor: '#A8D0DB',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginVertical: 16,
  },
  envContainer: {
    flexDirection: 'row',
    marginVertical: 16,
    justifyContent: 'space-evenly',
  },
  logBox: {
    alignItems: 'flex-start',
    marginVertical: 16,
  },
});

export default App;
