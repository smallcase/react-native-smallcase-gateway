import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  setConfigEnvironment(
    envName: string,
    gateway: string,
    isLeprechaunActive: boolean,
    isAmoEnabled: boolean,
    preProvidedBrokers: string[]
  ): Promise<boolean>;
  setHybridSdkVersion(sdkVersion: string): void;
  getSdkVersion(reactNativeSdkVersion: string): Promise<string>;
  init(sdkToken: string): Promise<boolean>;
  triggerTransaction(
    transactionId: string,
    utmParams: Object | null,
    brokerList: string[] | null
  ): Promise<Object>;
  triggerMfTransaction(transactionId: string): Promise<Object>;
  showOrders(): Promise<boolean>;
  launchSmallplug(
    targetEndpoint: string,
    params: string
  ): Promise<Object>;
  launchSmallplugWithBranding(
    targetEndpoint: string,
    params: string,
    headerColor: string | null,
    headerOpacity: number | null,
    backIconColor: string | null,
    backIconOpacity: number | null
  ): Promise<Object>;
  archiveSmallcase(iscid: string): Promise<Object>;
  logoutUser(): Promise<boolean>;
  triggerLeadGen(userDetails: Object, utmData: Object): void;
  triggerLeadGenWithStatus(userDetails: Object): Promise<string>;
  triggerLeadGenWithLoginCta(
    userDetails: Object,
    utmData: Object,
    showLoginCta: boolean
  ): Promise<string>;
  setupLoans(config: Object): Promise<Object>;
  apply(loanConfig: Object): Promise<Object>;
  pay(loanConfig: Object): Promise<Object>;
  withdraw(loanConfig: Object): Promise<Object>;
  service(loanConfig: Object): Promise<Object>;
  triggerInteraction(loanConfig: Object): Promise<Object>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SmallcaseGateway');

