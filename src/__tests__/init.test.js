jest.mock('react-native');

import SmallcaseGateway from '../index';
import { NativeModules } from 'react-native';

describe('init', () => {
  const initFn = jest.spyOn(NativeModules.SmallcaseGateway, 'init');

  test('valid', async () => {
    await SmallcaseGateway.init('test-token');
    expect(initFn).toHaveBeenNthCalledWith(1, 'test-token');
  });

  test('empty', async () => {
    await SmallcaseGateway.init();
    expect(initFn).toHaveBeenNthCalledWith(2, '');
  });

  test('invalid', async () => {
    await SmallcaseGateway.init(undefined);
    expect(initFn).toHaveBeenNthCalledWith(3, '');

    await SmallcaseGateway.init({});
    expect(initFn).toHaveBeenNthCalledWith(4, '');

    await SmallcaseGateway.init(123);
    expect(initFn).toHaveBeenNthCalledWith(5, '');
  });
});
