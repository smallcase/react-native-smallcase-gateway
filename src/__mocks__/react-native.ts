export const NativeModules = {
  SmallcaseGateway: {
    init: jest.fn(),
    triggerLeadGen: jest.fn(),
    triggerTransaction: jest.fn(),
    launchScWebView: jest.fn(),
    setConfigEnvironment: jest.fn(),
    setHybridSdkVersion: jest.fn(),
  },
};
