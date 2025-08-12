// Android-specific re-export to match iOS import path
// This ensures `import ... from './SCGatewayEventEmitter'` resolves on Android
export { default, SCGatewayEvents, SCGatewayEventTypes } from './SCGatewayEventManager.android';


