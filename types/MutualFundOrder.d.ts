export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;
export interface JsonObject { [key: string]: JsonValue; }

export interface MutualFundAnalyticsEvent {
  label: string;
  data?: JsonObject;
  integrations: string[];
}

export interface MutualFundCheckoutRequest {
  checkoutId: string;
  config: JsonObject;
  /** Call opened after mounting; close/error end this checkout, not the order. */
  emit: (event: 'opened' | 'state_change' | 'close' | 'error' | 'analytics', data: JsonObject) => void;
}

export interface MutualFundOrderOptions {
  transactionId: string;
  /** Optional native checkout renderer. Return an idempotent presentation disposer. */
  onCheckout?: (request: MutualFundCheckoutRequest) => () => void;
  /** Open-ended launch configuration, deeply snapshotted before calling native code. */
  metadata?: JsonObject;
  /** HTTP(S) base URL override. The API URL's path and authentication query are retained. */
  webclientUrl?: string;
  onAnalyticsEvent?: (events: MutualFundAnalyticsEvent[]) => void;
  /** Resolves a parent-app action while the MF order remains open. */
  onNativeAction: (intent: string, metadata?: JsonObject) => void;
}

export interface MutualFundOrderResult {
  success: boolean;
  reason: string;
  /** Next destination after the order flow closes. */
  intent?: string;
  data?: JsonObject;
  error?: string;
  errorCode?: string;
}
