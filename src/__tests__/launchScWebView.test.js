jest.mock('react-native');

import SmallcaseGateway from '../index';
import { NativeModules } from 'react-native';

describe('launchScWebView', () => {
  test('launches an absolute HTTP(S) URL', async () => {
    await SmallcaseGateway.launchScWebView('https://www.smallcase.com');

    expect(NativeModules.SmallcaseGateway.launchScWebView).toHaveBeenCalledWith(
      'https://www.smallcase.com'
    );
  });

  test('rejects an invalid URL before invoking native', async () => {
    await expect(
      SmallcaseGateway.launchScWebView('smallcase.com')
    ).rejects.toThrow('A valid absolute HTTP(S) URL is required');
  });
});
