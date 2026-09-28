const nativeSdks = require('../../native-sdk.json');
const packageJson = require('../../package.json');

const SDKS = ['gateway', 'loans'];
const MAVEN_COORDINATE = /^[\w.-]+:[\w.-]+:[\w.-]+$/;

const isValidAndroidPin = (pin) =>
  typeof pin === 'string' && MAVEN_COORDINATE.test(pin);

const isValidIosPin = (pin) =>
  pin !== null &&
  typeof pin === 'object' &&
  typeof pin.name === 'string' &&
  pin.name.length > 0 &&
  typeof pin.version === 'string' &&
  pin.version.length > 0;

describe('native-sdk.json', () => {
  test('is shipped in the npm package', () => {
    expect(packageJson.files).toContain('native-sdk.json');
  });

  test('defines release and debug modes', () => {
    expect(Object.keys(nativeSdks).sort()).toEqual(['debug', 'release']);
  });

  test.each(Object.keys(nativeSdks))(
    '%s mode lists every SDK for both platforms',
    (mode) => {
      expect(Object.keys(nativeSdks[mode].android).sort()).toEqual(SDKS);
      expect(Object.keys(nativeSdks[mode].ios).sort()).toEqual(SDKS);
    }
  );

  test('release mode pins every SDK', () => {
    SDKS.forEach((sdk) => {
      expect(isValidAndroidPin(nativeSdks.release.android[sdk])).toBe(true);
      expect(isValidIosPin(nativeSdks.release.ios[sdk])).toBe(true);
    });
  });

  test('debug mode pins are well formed when set', () => {
    SDKS.forEach((sdk) => {
      const androidPin = nativeSdks.debug.android[sdk];
      const iosPin = nativeSdks.debug.ios[sdk];
      if (androidPin !== null) {
        expect(isValidAndroidPin(androidPin)).toBe(true);
      }
      if (iosPin !== null) {
        expect(isValidIosPin(iosPin)).toBe(true);
      }
    });
  });
});
