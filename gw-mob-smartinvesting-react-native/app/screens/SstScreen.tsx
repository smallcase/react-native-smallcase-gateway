import SegmentedControl from '@react-native-segmented-control/segmented-control';
import React, {useContext, useState} from 'react';
import {Button, FlatList, Text, TextInput, View} from 'react-native';

import {placeSstOrder, showOrders, showToast} from '../apis/Functions';
import {EnvContext} from '../EnvProvider';
import {SstCartContext} from '../SstCartProvider';

const renderItem = ({item}) => (
  <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
    <Text>{item.ticker}</Text>
    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
      <Text>{item.type}</Text>
      <Text>{item.quantity}</Text>
    </View>
  </View>
);

function _getTypeFromIndex(i: number): string | null | undefined {
  switch (i) {
    case 0:
      return 'BUY';
    case 1:
      return 'SELL';
    case 2:
      return undefined;

    default:
      return null;
  }
}

function _getIndexFromType(i: string | null | undefined): number {
  switch (i) {
    case 'BUY':
      return 0;
    case 'SELL':
      return 1;
    case undefined:
      return 2;
    default:
      return 0;
  }
}

const SstScreen = () => {
  const state = useContext(EnvContext);
  const sstState = useContext(SstCartContext);
  const [count, setCount] = useState(0);
  const [securities, setSecurities] = useState('');
  const [type, setType] = useState<string | null | undefined>('BUY');
  const env = state.env;
  const textInputRef = React.createRef<TextInput>();
  return (
    <View>
      <SegmentedControl
        values={['BUY', 'SELL', 'NONE']}
        selectedIndex={_getIndexFromType(type)}
        onChange={event => {
          setType(_getTypeFromIndex(event.nativeEvent.selectedSegmentIndex));
        }}
      />
      <View style={{flexDirection: 'row'}}>
        <TextInput
          ref={textInputRef}
          style={{marginHorizontal: 12, flex: 1}}
          placeholder="Enter securities. e.g. TCS, RELIANCE, ..."
          onChangeText={value => {
            console.log(`ti val: ${value}`);
            setSecurities(value);
            console.log(`secur val: ${securities}`);
          }}
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            alignContent: 'center',
          }}>
          <Button
            title="-"
            onPress={() => {
              let newCount = count - 1;
              setCount(newCount);
            }}
          />
          <Text> {count} </Text>
          <Button
            title="+"
            onPress={() => {
              let newCount = count + 1;
              setCount(newCount);
            }}
          />
        </View>
      </View>
      <Button
        title="Add to Cart"
        onPress={() => {
          if (securities.length === 0) {
            showToast('Please enter the name of a valid Security');
            return;
          }
          const se = securities.split(',').map(s => {
            return {
              ticker: s.trim(),
              quantity: count < 1 ? undefined : count,
              type: type,
            };
          });
          se.push(...sstState.sstCart);
          sstState.setSstCart(se);
          setSecurities('');
          setCount(0);
          textInputRef.current?.clear();
        }}
      />
      <Button
        onPress={async () => {
          const orderConfig = {
            type: 'SECURITIES',
            securities: sstState.sstCart,
          };
          await placeSstOrder(env, state.userId, orderConfig);
          sstState.setSstCart([]);
        }}
        title={'Place Order'}
        accessibilityLabel="Learn more about this purple button"
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          marginVertical: 12,
          justifyContent: 'space-between',
          alignContent: 'center',
        }}>
        <Text>Cart</Text>
        <Button
          title="Clear"
          onPress={() => {
            sstState.setSstCart([]);
          }}
        />
      </View>
      <FlatList
        data={sstState.sstCart}
        renderItem={renderItem}
        keyExtractor={item => item.ticker}
      />
      <Button
        title="Show Orders"
        onPress={() => {
          showOrders();
        }}
      />
    </View>
  );
};

export {SstScreen};
