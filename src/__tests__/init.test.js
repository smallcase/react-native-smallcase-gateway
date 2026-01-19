jest.mock('react-native');

import SmallcaseGateway from '../index';
import { NativeModules } from 'react-native';

describe('init', () => {
  const initFn = jest.spyOn(NativeModules.SmallcaseGateway, 'init');

  test('valid', async () => {
    await SmallcaseGateway.init('test-token');
    expect(initFn).toHaveBeenNthCalledWith(1, 'test-token', null);
  });

  test('valid with externalMeta', async () => {
    const externalMeta = {
      externalIdentifier: {
        userId: 'user123',
      },
    };
    await SmallcaseGateway.init('test-token', externalMeta);
    expect(initFn).toHaveBeenNthCalledWith(2, 'test-token', externalMeta);
  });

  test('empty', async () => {
    await SmallcaseGateway.init();
    expect(initFn).toHaveBeenNthCalledWith(3, '', null);
  });

  test('invalid', async () => {
    await SmallcaseGateway.init(undefined);
    expect(initFn).toHaveBeenNthCalledWith(4, '', null);

    await SmallcaseGateway.init('test-token', {});
    expect(initFn).toHaveBeenNthCalledWith(5, 'test-token', {});

    await SmallcaseGateway.init(123);
    expect(initFn).toHaveBeenNthCalledWith(6, '', null);
  });
});
