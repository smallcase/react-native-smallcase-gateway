import { NativeEventEmitter, NativeModules } from 'react-native';

const EVENT_NAME = 'scg_mf_order_event';
let activeLaunch = null;
let sequence = 0;

const failure = (errorCode, error) => ({
  success: false,
  reason: 'launch_error',
  errorCode,
  error,
});

// Validate before crossing the RN bridge; keep functions and non-JSON objects out.
function snapshotMetadata(metadata) {
  const ancestors = new Set();
  const validate = (value) => {
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'boolean'
    ) {
      return;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return;
    }
    if (typeof value !== 'object' || ancestors.has(value)) {
      throw new TypeError('metadata must contain JSON values without cycles');
    }
    const prototype = Object.getPrototypeOf(value);
    if (
      !Array.isArray(value) &&
      prototype !== Object.prototype &&
      prototype !== null
    ) {
      throw new TypeError('metadata must contain plain JSON objects');
    }
    ancestors.add(value);
    Object.keys(value).forEach((key) => validate(value[key]));
    ancestors.delete(value);
  };
  if (metadata === undefined) {
    return {};
  }
  if (
    metadata === null ||
    typeof metadata !== 'object' ||
    Array.isArray(metadata)
  ) {
    throw new TypeError('metadata must be a JSON object');
  }
  validate(metadata);
  return JSON.parse(JSON.stringify(metadata));
}

/**
 * Launch an MF order. Callbacks stay in JS; the Promise returns the final result.
 * @param {import('../types/MutualFundOrder').MutualFundOrderOptions} options
 * @returns {Promise<import('../types/MutualFundOrder').MutualFundOrderResult>}
 */
export default async function launchMutualFundOrder(options) {
  if (activeLaunch !== null) {
    return failure('FLOW_IN_PROGRESS', 'A mutual fund order is already active');
  }
  if (
    !options ||
    typeof options.transactionId !== 'string' ||
    !options.transactionId.trim() ||
    typeof options.onNativeAction !== 'function' ||
    (options.onCheckout !== undefined &&
      typeof options.onCheckout !== 'function') ||
    (options.onAnalyticsEvent !== undefined &&
      typeof options.onAnalyticsEvent !== 'function') ||
    (options.webclientUrl !== undefined &&
      typeof options.webclientUrl !== 'string')
  ) {
    return failure(
      'INVALID_CONFIG',
      'Provide transactionId, onNativeAction and valid optional fields'
    );
  }
  let metadata;
  try {
    metadata = snapshotMetadata(options.metadata);
  } catch (error) {
    return failure('INVALID_CONFIG', error.message);
  }
  const native = NativeModules.SmallcaseGateway;
  if (!native || typeof native.launchMutualFundOrder !== 'function') {
    return failure(
      'NATIVE_API_UNAVAILABLE',
      'Rebuild the app with native SDKs supporting launchMutualFundOrder'
    );
  }

  const { transactionId, webclientUrl, onNativeAction, onAnalyticsEvent } =
    options;
  const launchId = `mf-${Date.now()}-${++sequence}-${Math.random()
    .toString(36)
    .slice(2)}`;
  activeLaunch = launchId;
  let subscription;
  let checkout;
  const seenCheckouts = new Set();
  const hasCheckoutHandler =
    typeof options.onCheckout === 'function' &&
    typeof native.sendMutualFundCheckoutEvent === 'function';
  const dismissCheckout = () => {
    const current = checkout;
    checkout = undefined;
    try {
      current?.dispose?.();
    } catch (error) {
      console.error('[SmallcaseGateway] Checkout cleanup failed', error);
    }
  };
  try {
    // Subscribe before invoking native code: callbacks may arrive before its Promise settles.
    subscription = new NativeEventEmitter(native).addListener(
      EVENT_NAME,
      (event) => {
        if (
          !event ||
          event.launchId !== launchId ||
          activeLaunch !== launchId
        ) {
          return;
        }
        try {
          if (event.type === 'CHECKOUT_DISMISS') {
            if (checkout?.id === event.checkoutId) dismissCheckout();
            return;
          }
          if (event.type === 'CHECKOUT_OPEN' && hasCheckoutHandler) {
            if (
              checkout ||
              typeof event.checkoutId !== 'string' ||
              !event.checkoutId ||
              !event.config ||
              typeof event.config !== 'object' ||
              Array.isArray(event.config)
            )
              return;
            if (seenCheckouts.has(event.checkoutId)) return;
            seenCheckouts.add(event.checkoutId);
            const current = {
              id: event.checkoutId,
              dispose: undefined,
              ended: false,
            };
            checkout = current;
            const send = (type, data) => {
              if (
                activeLaunch !== launchId ||
                checkout !== current ||
                current.ended
              )
                return;
              if (
                ![
                  'opened',
                  'state_change',
                  'close',
                  'error',
                  'analytics',
                ].includes(type)
              )
                return;
              // Match WebView JSON serialization (optional SDK fields may be undefined).
              const payload = snapshotMetadata(
                JSON.parse(JSON.stringify(data))
              );
              if (type === 'close' || type === 'error') current.ended = true;
              Promise.resolve(
                native.sendMutualFundCheckoutEvent(
                  launchId,
                  current.id,
                  type,
                  payload
                )
              ).catch((error) =>
                console.error('[SmallcaseGateway] Checkout reply failed', error)
              );
            };
            try {
              const dispose = options.onCheckout({
                checkoutId: current.id,
                config: event.config,
                emit: send,
              });
              if (typeof dispose !== 'function')
                throw new TypeError('onCheckout must return a disposer');
              if (checkout === current) current.dispose = dispose;
              else dispose();
            } catch (error) {
              send('error', {
                message: error?.message || 'Native checkout failed',
              });
              dismissCheckout();
            }
            return;
          }
          if (
            event.type === 'NATIVE_ACTION' &&
            typeof event.intent === 'string' &&
            event.intent.trim()
          ) {
            onNativeAction(
              event.intent,
              event.metadata == null ? undefined : event.metadata
            );
          } else if (
            event.type === 'ANALYTICS_EVENT' &&
            Array.isArray(event.events)
          ) {
            onAnalyticsEvent?.(event.events);
          }
        } catch (error) {
          console.error('[SmallcaseGateway] MF host callback failed', error);
        }
      }
    );
    return await native.launchMutualFundOrder({
      transactionId,
      metadata,
      ...(webclientUrl === undefined ? {} : { webclientUrl }),
      launchId,
      hasAnalyticsListener: typeof onAnalyticsEvent === 'function',
      ...(hasCheckoutHandler ? { hasCheckoutHandler: true } : {}),
    });
  } finally {
    if (activeLaunch === launchId) {
      activeLaunch = null;
    }
    subscription?.remove();
    dismissCheckout();
  }
}
