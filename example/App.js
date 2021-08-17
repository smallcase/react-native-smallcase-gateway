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

  const [sdkToken, setSdkToken] = useState(
    'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJndWVzdCI6dHJ1ZSwiaWF0IjoxNTk5Njc0MzYyLCJleHAiOjE2OTk2Nzc5NjJ9.KUNm8Sz4e_qG7BZQTO6smBVCMeOcSf2ORkiClS7b6lw',
  );

  const [iscid, setIscid] = useState('60ae3f69e3f4b0e0c5f98d12');

  const [transactionId, setTransactionId] = useState('');

  const updateEnv = useCallback(async () => {
    setLog((p) => p + '\n setting config');

    try {
      await SmallcaseGateway.setConfigEnvironment({
        environmentName: env,
        gatewayName: 'gatewaydemo',
        isLeprechaun: true,
        brokerList: [],
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
      setLog((p) => p + '\n error during init' + JSON.stringify(err.userInfo));
    }
  }, [sdkToken]);

  const startTransaction = useCallback(async () => {
    setLog((p) => p + '\n starting transaction');
    try {
      const res = await SmallcaseGateway.triggerTransaction(transactionId, {
        test: 'test',
      });
      setLog((p) => p + '\n transaction success');
      setLog((p) => p + '\n' + JSON.stringify(res, null, 2));
    } catch (err) {
      setLog(
        (p) => p + '\n error during transaction' + JSON.stringify(err.userInfo),
      );
    }
  }, [transactionId]);

  const markSmallcaseArchive = useCallback(async () => {
    setLog((p) => p + '\n marking smallcase archive');
    try {
      const res = await SmallcaseGateway.archiveSmallcase(iscid);
      setLog((p) => p + '\n archive success');
      setLog((p) => p + '\n' + JSON.stringify(res, null, 2));
    } catch (err) {
      setLog(
        (p) => p + '\n error during archive' + JSON.stringify(err),
      );
    }
  }, [iscid]);

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

      <View style={styles.envContainer}>
        <Button
          title="Open lead gen"
          onPress={() => {
            SmallcaseGateway.triggerLeadGen();
          }}
        />
      </View>

      <TextInput
        value={iscid}
        onChangeText={setIscid}
        style={styles.inp}
        placeholder="iscid"
      />
      <Button title="archive smallcase" onPress={markSmallcaseArchive} />

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
