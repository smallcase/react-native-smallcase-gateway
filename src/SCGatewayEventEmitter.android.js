// 📡 SCGatewayEventEmitter.js - Platform Re-export for Cross-Platform Compatibility
// 🔄 Android-specific re-export to match iOS import path
// This ensures `import ... from './SCGatewayEventEmitter'` resolves on Android

// would be removed

// Re-export all Gateway functionality (unchanged)
export { 
  default,                    // scGatewayEventManager
  SCGatewayEvents, 
  SCGatewayEventTypes 
} from './SCGatewayEventManager.android';

// 🆕 Re-export all Loans functionality (new)
export { 
  SCLoansEvents, 
  SCLoansEventTypes,
  scLoansEventManager 
} from './SCGatewayEventManager.android';