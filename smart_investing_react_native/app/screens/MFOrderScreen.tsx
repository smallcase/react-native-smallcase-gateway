import React, {useRef, useState} from 'react';
import {
  Button,
  NativeModules,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import SmallcaseGateway from 'react-native-smallcase-gateway';
import type {JsonObject} from 'react-native-smallcase-gateway';

export function MFOrderScreen() {
  const [gatewayName, setGatewayName] = useState('gatewaydemo-stag');
  const [userId, setUserId] = useState('');
  const [jwt, setJwt] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [webclientUrl, setWebclientUrl] = useState(
    'https://mf-stag.smallcase.com',
  );
  const [metadata, setMetadata] = useState(
    JSON.stringify(
      {theme: {preference: 'dark'}, testValue: 'from-react-native'},
      null,
      2,
    ),
  );
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const [smokeStatus, setSmokeStatus] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const running = useRef(false);
  const available =
    typeof NativeModules.SmallcaseGateway?.launchMutualFundOrder === 'function';

  const record = (name: string, value: unknown) => {
    setEvents(previous =>
      [
        `${new Date().toLocaleTimeString()} ${name}\n${JSON.stringify(
          value,
          null,
          2,
        )}`,
        ...previous,
      ].slice(0, 40),
    );
  };

  const perform = async (action: () => Promise<void>) => {
    if (running.current) {
      return;
    }
    running.current = true;
    setBusy(true);
    try {
      await action();
    } catch (error) {
      record('Error', error instanceof Error ? error.message : String(error));
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  const initialize = () =>
    perform(async () => {
      setInitialized(false);
      await SmallcaseGateway.setConfigEnvironment({
        gatewayName: gatewayName.trim(),
        environmentName: 'staging',
        isLeprechaun: false,
        isAmoEnabled: true,
        brokerList: [],
      });
      let token = jwt.trim();
      if (!token) {
        if (!userId.trim()) {
          throw new Error('Enter a staging user ID or an SDK JWT.');
        }
        const response = await fetch(
          'https://api-stag.smartinvesting.io/user/login',
          {
            method: 'POST',
            headers: {'content-type': 'application/x-www-form-urlencoded'},
            body: `id=${encodeURIComponent(userId.trim())}`,
          },
        );
        if (!response.ok) {
          throw new Error(`Staging login failed (${response.status}).`);
        }
        const body = await response.json();
        token = body.smallcaseAuthToken;
        if (typeof token !== 'string' || !token) {
          throw new Error('Login did not return an SDK JWT.');
        }
      }
      await SmallcaseGateway.init(token);
      setInitialized(true);
      record('SDK initialized', {
        environment: 'staging',
        version: await SmallcaseGateway.getSdkVersion(),
      });
    });

  const launch = () =>
    perform(async () => {
      if (!initialized) {
        throw new Error('Initialize the staging SDK first.');
      }
      const parsed: JsonObject = JSON.parse(metadata);
      const result = await SmallcaseGateway.launchMutualFundOrder({
        transactionId: transactionId.trim(),
        metadata: parsed,
        webclientUrl: webclientUrl.trim() || undefined,
        onAnalyticsEvent: analyticsEnabled
          ? payload => record('Analytics', payload)
          : undefined,
        onNativeAction: (intent, payload) =>
          record('Native action', {intent, metadata: payload}),
      });
      record('Order result', result);
    });

  // An invalid URL is rejected by native configuration validation before any API request.
  // This exercises the real RN Promise bridge without a user token or an order.
  const smokeCheck = () =>
    perform(async () => {
      const result = await SmallcaseGateway.launchMutualFundOrder({
        transactionId: 'local-bridge-smoke-test',
        webclientUrl: 'not-a-valid-url',
        onNativeAction: () => {},
      });
      setSmokeStatus(
        result.errorCode === 'INVALID_CONFIG'
          ? 'Native bridge check passed'
          : 'Native bridge check failed — see log',
      );
      record('Native bridge smoke check', {
        passed: result.errorCode === 'INVALID_CONFIG',
        result,
      });
    });

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>MF order test</Text>
      <Text>Environment: staging</Text>
      <Text testID="mf-native-status">
        Native order API: {available ? 'available' : 'missing — rebuild app'}
      </Text>
      <Button
        title="Check native bridge"
        testID="mf-smoke-check"
        disabled={busy || !available}
        onPress={smokeCheck}
      />
      {smokeStatus ? <Text testID="mf-smoke-status">{smokeStatus}</Text> : null}
      <Text style={styles.label}>Gateway name</Text>
      <TextInput
        style={styles.input}
        value={gatewayName}
        editable={!busy}
        autoCapitalize="none"
        onChangeText={value => {
          setGatewayName(value);
          setInitialized(false);
        }}
      />
      <Text style={styles.label}>Staging user ID</Text>
      <TextInput
        style={styles.input}
        value={userId}
        editable={!busy}
        autoCapitalize="none"
        placeholder="Same user as the MF order"
        onChangeText={value => {
          setUserId(value);
          setInitialized(false);
        }}
      />
      <Text style={styles.label}>
        SDK JWT (optional; otherwise fetched using user ID)
      </Text>
      <TextInput
        style={styles.input}
        value={jwt}
        editable={!busy}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={value => {
          setJwt(value);
          setInitialized(false);
        }}
      />
      <Button
        title={
          initialized
            ? 'SDK initialized — initialize again'
            : 'Initialize staging SDK'
        }
        disabled={busy || !available}
        onPress={initialize}
      />
      <Text style={styles.label}>MF order transaction ID</Text>
      <TextInput
        style={styles.input}
        value={transactionId}
        editable={!busy}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setTransactionId}
      />
      <Text style={styles.label}>Webclient base URL</Text>
      <TextInput
        style={styles.input}
        value={webclientUrl}
        editable={!busy}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setWebclientUrl}
      />
      <Text style={styles.label}>Metadata (JSON)</Text>
      <TextInput
        style={[styles.input, styles.metadata]}
        multiline
        value={metadata}
        editable={!busy}
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setMetadata}
      />
      <View style={styles.row}>
        <Text>Receive analytics</Text>
        <Switch
          value={analyticsEnabled}
          disabled={busy}
          onValueChange={setAnalyticsEnabled}
        />
      </View>
      <Button
        title={busy ? 'Working…' : 'Launch MF order'}
        disabled={busy || !initialized || !transactionId.trim()}
        onPress={launch}
      />
      <Text style={styles.label}>Callbacks and results</Text>
      <Text>
        Native actions are logged here; the test app does not navigate away.
      </Text>
      <Button title="Clear log" onPress={() => setEvents([])} />
      {events.map((event, index) => (
        <Text
          selectable
          testID={`mf-event-${index}`}
          style={styles.event}
          key={`${index}-${event}`}>
          {event}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {padding: 16, paddingBottom: 48, gap: 10},
  heading: {fontSize: 24, fontWeight: '600'},
  label: {fontWeight: '600', marginTop: 8},
  input: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 6,
    padding: 10,
    color: '#111',
    backgroundColor: '#fff',
  },
  metadata: {minHeight: 120, textAlignVertical: 'top'},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  event: {padding: 12, backgroundColor: '#eee', color: '#111', fontSize: 12},
});
