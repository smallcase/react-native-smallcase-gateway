const mockListeners = new Set();
const mockRemoved = jest.fn();
const mockNativeLaunch = jest.fn();

jest.mock('react-native', () => ({
  NativeModules: {
    SmallcaseGateway: {
      launchMutualFundOrder: (...args) => mockNativeLaunch(...args),
    },
  },
  NativeEventEmitter: class {
    addListener(name, callback) {
      const listener = { name, callback };
      mockListeners.add(listener);
      return {
        remove: () => {
          mockRemoved();
          mockListeners.delete(listener);
        },
      };
    }
  },
}));

import SmallcaseGateway from '../SmallcaseGateway';
const { launchMutualFundOrder } = SmallcaseGateway;
import { NativeModules } from 'react-native';

const options = (extra = {}) => ({
  transactionId: 'txn',
  onNativeAction: jest.fn(),
  ...extra,
});
const emit = (event) =>
  mockListeners.forEach(({ callback }) => callback(event));
let settle;

beforeEach(() => {
  mockNativeLaunch.mockReset();
  mockRemoved.mockClear();
  mockNativeLaunch.mockImplementation(
    () =>
      new Promise((resolve) => {
        settle = resolve;
      })
  );
});

afterEach(() => {
  expect(mockListeners.size).toBe(0);
});

test('passes only serializable options and returns structured order details and next step', async () => {
  const onNativeAction = jest.fn();
  const onAnalyticsEvent = jest.fn();
  const metadata = {
    theme: { preference: 'dark' },
    future: { nested: [true, null, 42] },
  };
  const result = launchMutualFundOrder(
    options({
      onNativeAction,
      onAnalyticsEvent,
      metadata,
      webclientUrl: 'https://local.example',
    })
  );
  const payload = mockNativeLaunch.mock.calls[0][0];
  expect(payload).toEqual({
    transactionId: 'txn',
    metadata,
    webclientUrl: 'https://local.example',
    launchId: expect.any(String),
    hasAnalyticsListener: true,
  });
  expect(payload.onNativeAction).toBeUndefined();
  expect(payload.onAnalyticsEvent).toBeUndefined();
  metadata.theme.preference = 'light';
  expect(payload.metadata.theme.preference).toBe('dark');
  const response = {
    success: true,
    reason: 'order_success',
    intent: 'see_investments',
    data: { orderId: 'order', orders: [{ status: 'PROCESSING' }] },
  };
  settle(response);
  await expect(result).resolves.toEqual(response);
  expect(mockRemoved).toHaveBeenCalledTimes(1);
});

test('subscribes before native launch and keeps host actions nonterminal', async () => {
  const onNativeAction = jest.fn();
  mockNativeLaunch.mockImplementation((payload) => {
    emit({
      launchId: payload.launchId,
      type: 'NATIVE_ACTION',
      intent: 'add_funds',
      metadata: { amount: 500 },
    });
    return new Promise((resolve) => {
      settle = resolve;
    });
  });
  const result = launchMutualFundOrder(options({ onNativeAction }));
  expect(onNativeAction).toHaveBeenCalledWith('add_funds', { amount: 500 });
  expect(mockListeners.size).toBe(1);
  settle({ success: false, reason: 'user_back', errorCode: 'USER_CANCELLED' });
  await expect(result).resolves.toMatchObject({ errorCode: 'USER_CANCELLED' });
});

test('forwards optional analytics and filters other launches and malformed events', async () => {
  const onNativeAction = jest.fn();
  const onAnalyticsEvent = jest.fn();
  const result = launchMutualFundOrder(
    options({ onNativeAction, onAnalyticsEvent })
  );
  const { launchId } = mockNativeLaunch.mock.calls[0][0];
  const events = [
    { label: 'Viewed', data: { amount: 100 }, integrations: ['MixPanel'] },
  ];
  emit({ launchId: 'other', type: 'NATIVE_ACTION', intent: 'bad' });
  emit(null);
  emit({ launchId, type: 'NATIVE_ACTION', intent: '' });
  emit({ launchId, type: 'ANALYTICS_EVENT', events: 'bad' });
  emit({ launchId, type: 'ANALYTICS_EVENT', events });
  expect(onNativeAction).not.toHaveBeenCalled();
  expect(onAnalyticsEvent).toHaveBeenCalledWith(events);
  settle({ success: true });
  await result;
});

test('omitted analytics remains optional and no callback function crosses the bridge', async () => {
  const result = launchMutualFundOrder(options());
  const payload = mockNativeLaunch.mock.calls[0][0];
  expect(payload.hasAnalyticsListener).toBe(false);
  expect(payload.metadata).toEqual({});
  expect(payload).not.toHaveProperty('webclientUrl');
  emit({ launchId: payload.launchId, type: 'ANALYTICS_EVENT', events: [] });
  settle({ success: true });
  await result;
});

test('rejects overlapping launches without stealing callbacks', async () => {
  const first = launchMutualFundOrder(options());
  await expect(launchMutualFundOrder(options())).resolves.toMatchObject({
    errorCode: 'FLOW_IN_PROGRESS',
  });
  expect(mockNativeLaunch).toHaveBeenCalledTimes(1);
  settle({ success: true });
  await first;
});

test('old events cannot reach a later launch of the same transaction', async () => {
  const first = launchMutualFundOrder(options());
  const oldId = mockNativeLaunch.mock.calls[0][0].launchId;
  const oldCallback = [...mockListeners][0].callback;
  settle({ success: true });
  await first;
  const onNativeAction = jest.fn();
  const second = launchMutualFundOrder(options({ onNativeAction }));
  expect(mockNativeLaunch.mock.calls[1][0].launchId).not.toBe(oldId);
  oldCallback({ launchId: oldId, type: 'NATIVE_ACTION', intent: 'late' });
  emit({ launchId: oldId, type: 'NATIVE_ACTION', intent: 'late' });
  expect(onNativeAction).not.toHaveBeenCalled();
  settle({ success: true });
  await second;
});

test.each([
  undefined,
  {},
  { transactionId: 'txn' },
  options({ transactionId: '' }),
  options({ onAnalyticsEvent: 'invalid' }),
  options({ webclientUrl: 42 }),
])('invalid options do not launch native: %p', async (invalid) => {
  await expect(launchMutualFundOrder(invalid)).resolves.toMatchObject({
    errorCode: 'INVALID_CONFIG',
  });
  expect(mockNativeLaunch).not.toHaveBeenCalled();
});

test('rejects cycles and non-JSON metadata before crossing the bridge', async () => {
  const cycle = {};
  cycle.self = cycle;
  for (const metadata of [
    null,
    [],
    cycle,
    { fn: () => {} },
    { amount: Infinity },
    { date: new Date() },
    { value: BigInt(1) },
  ]) {
    await expect(
      launchMutualFundOrder(options({ metadata }))
    ).resolves.toMatchObject({ errorCode: 'INVALID_CONFIG' });
  }
  expect(mockNativeLaunch).not.toHaveBeenCalled();
});

test('missing native API gives an actionable error', async () => {
  const original = NativeModules.SmallcaseGateway.launchMutualFundOrder;
  delete NativeModules.SmallcaseGateway.launchMutualFundOrder;
  try {
    await expect(launchMutualFundOrder(options())).resolves.toMatchObject({
      errorCode: 'NATIVE_API_UNAVAILABLE',
    });
  } finally {
    NativeModules.SmallcaseGateway.launchMutualFundOrder = original;
  }
});

test('cleans up when native rejects and permits a subsequent launch', async () => {
  mockNativeLaunch.mockRejectedValueOnce(new Error('bridge failed'));
  await expect(launchMutualFundOrder(options())).rejects.toThrow(
    'bridge failed'
  );
  expect(mockRemoved).toHaveBeenCalledTimes(1);
  const next = launchMutualFundOrder(options());
  settle({ success: true });
  await next;
});

test('cleans up synchronous native failures', async () => {
  mockNativeLaunch.mockImplementationOnce(() => {
    throw new Error('sync failure');
  });
  await expect(launchMutualFundOrder(options())).rejects.toThrow(
    'sync failure'
  );
  expect(mockRemoved).toHaveBeenCalledTimes(1);
});

test('a throwing host callback does not interrupt the order or leak its listener', async () => {
  const logged = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const result = launchMutualFundOrder(
      options({
        onNativeAction: () => {
          throw new Error('host failure');
        },
      })
    );
    const { launchId } = mockNativeLaunch.mock.calls[0][0];
    emit({ launchId, type: 'NATIVE_ACTION', intent: 'add_funds' });
    expect(logged).toHaveBeenCalledTimes(1);
    expect(mockListeners.size).toBe(1);
    settle({ success: true, reason: 'order_success' });
    await expect(result).resolves.toMatchObject({ success: true });
  } finally {
    logged.mockRestore();
  }
});

test('native checkout is opt-in, correlated and disposed when the order completes', async () => {
  const reply = jest.fn().mockResolvedValue(true);
  NativeModules.SmallcaseGateway.sendMutualFundCheckoutEvent = reply;
  const dispose = jest.fn();
  const onCheckout = jest.fn(() => dispose);
  const result = launchMutualFundOrder(options({ onCheckout }));
  const { launchId, hasCheckoutHandler } = mockNativeLaunch.mock.calls[0][0];
  expect(hasCheckoutHandler).toBe(true);
  const event = {
    launchId,
    type: 'CHECKOUT_OPEN',
    checkoutId: 'payment-1',
    config: { product: { id: 'one' } },
  };
  emit({ ...event, launchId: 'stale' });
  emit(event);
  emit(event);
  expect(onCheckout).toHaveBeenCalledTimes(1);
  const request = onCheckout.mock.calls[0][0];
  request.emit('opened', {});
  request.emit('state_change', { state: 'pending' });
  expect(reply).toHaveBeenLastCalledWith(
    launchId,
    'payment-1',
    'state_change',
    { state: 'pending' }
  );
  emit({ launchId, type: 'CHECKOUT_DISMISS', checkoutId: 'stale' });
  expect(dispose).not.toHaveBeenCalled();
  settle({ success: true });
  await result;
  expect(dispose).toHaveBeenCalledTimes(1);
  reply.mockClear();
  request.emit('close', { code: 'M0' });
  expect(reply).not.toHaveBeenCalled();
  delete NativeModules.SmallcaseGateway.sendMutualFundCheckoutEvent;
});

test('older native bindings do not advertise checkout even when a handler is supplied', async () => {
  const result = launchMutualFundOrder(options({ onCheckout: jest.fn() }));
  expect(mockNativeLaunch.mock.calls[0][0].hasCheckoutHandler).toBeUndefined();
  settle({ success: true });
  await result;
});

test('throwing checkout host sends an error and checkout cancellation is scoped', async () => {
  const reply = jest.fn().mockResolvedValue(true);
  NativeModules.SmallcaseGateway.sendMutualFundCheckoutEvent = reply;
  const result = launchMutualFundOrder(
    options({
      onCheckout: () => {
        throw new Error('cannot mount');
      },
    })
  );
  const { launchId } = mockNativeLaunch.mock.calls[0][0];
  emit({
    launchId,
    type: 'CHECKOUT_OPEN',
    checkoutId: 'payment-1',
    config: {},
  });
  expect(reply).toHaveBeenCalledWith(launchId, 'payment-1', 'error', {
    message: 'cannot mount',
  });
  settle({ success: true });
  await result;
  delete NativeModules.SmallcaseGateway.sendMutualFundCheckoutEvent;
});

test('terminal checkout events ignore late replies and repeated opens, without closing the order', async () => {
  const reply = jest.fn().mockResolvedValue(true);
  NativeModules.SmallcaseGateway.sendMutualFundCheckoutEvent = reply;
  const dispose = jest.fn();
  const onCheckout = jest.fn(() => dispose);
  const result = launchMutualFundOrder(options({ onCheckout }));
  const { launchId } = mockNativeLaunch.mock.calls[0][0];
  const event = {
    launchId,
    type: 'CHECKOUT_OPEN',
    checkoutId: 'one',
    config: {},
  };
  emit(event);
  const request = onCheckout.mock.calls[0][0];
  request.emit('state_change', { state: 'pending', optional: undefined });
  expect(reply).toHaveBeenLastCalledWith(launchId, 'one', 'state_change', {
    state: 'pending',
  });
  request.emit('close', { code: 'M0' });
  request.emit('state_change', { state: 'success' });
  expect(reply).toHaveBeenCalledTimes(2);
  emit({ launchId, type: 'CHECKOUT_DISMISS', checkoutId: 'one' });
  emit(event);
  expect(onCheckout).toHaveBeenCalledTimes(1);
  expect(dispose).toHaveBeenCalledTimes(1);
  emit({ ...event, checkoutId: 'two' });
  expect(onCheckout).toHaveBeenCalledTimes(2);
  settle({ success: true });
  await result;
  expect(dispose).toHaveBeenCalledTimes(2);
  delete NativeModules.SmallcaseGateway.sendMutualFundCheckoutEvent;
});
