import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  startListening(): Promise<string>;
  stopListening(): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SCLoansBridgeEmitter');

