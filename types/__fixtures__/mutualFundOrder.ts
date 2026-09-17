import SmallcaseGateway, {
  JsonObject,
  MutualFundOrderOptions,
  MutualFundOrderResult,
} from '..';

const config: MutualFundOrderOptions = {
  transactionId: 'txn',
  metadata: { theme: { preference: 'dark' }, future: [null, 42, true] },
  webclientUrl: 'https://local.example',
  onAnalyticsEvent(events) {
    const label: string | undefined = events[0]?.label;
    void label;
  },
  onCheckout(request) {
    request.emit('opened', {});
    request.emit('state_change', { state: 'pending', data: {} });
    // @ts-expect-error Checkout replies use defined event names.
    request.emit('success', {});
    return () => {};
  },
  onNativeAction(intent, metadata) {
    const action: string = intent;
    const payload: JsonObject | undefined = metadata;
    void action;
    void payload;
  },
};

const result: Promise<MutualFundOrderResult> =
  SmallcaseGateway.launchMutualFundOrder(config);
void result;

// @ts-expect-error Native actions must have a host handler.
SmallcaseGateway.launchMutualFundOrder({ transactionId: 'txn' });
SmallcaseGateway.launchMutualFundOrder({
  ...config,
  // @ts-expect-error Completion is returned by the Promise, not a callback.
  onComplete: () => {},
});
SmallcaseGateway.launchMutualFundOrder({
  ...config,
  // @ts-expect-error Metadata must be JSON-compatible.
  metadata: { callback: () => {} },
});
