import React, {useContext} from 'react';
import {ScrollView, Text} from 'react-native';
import {TableSection} from '../components/Table';
import {EnvContext} from '../EnvProvider';
import {MFHolding} from '../models/HoldingsModels';

const MutualFundsScreen = ({}) => {
  const state = useContext(EnvContext);
  const mf = state.holdings?.mutualFunds?.holdings;
  console.log(`MFScreen Debug: ${mf}`);

  return mf === undefined || mf === null || mf?.length === 0 ? (
    <Text>No Mutual Funds to Display</Text>
  ) : (
    <ScrollView>
      {mf.map(m => (
        <MFHoldingItem title={`#${mf.indexOf(m)}`} data={m} />
      ))}
    </ScrollView>
  );
};
interface MFHoldingItemProps {
  title: string;
  data: MFHolding;
}
const MFHoldingItem = (props: MFHoldingItemProps) => (
  <TableSection
    title={props.title}
    rows={[
      {name: 'Folio', value: props.data.folio ?? ''},
      {name: 'Fund', value: props.data.fund ?? ''},
      {name: 'Pnl', value: props.data.pnl?.toString() ?? ''},
      {name: 'quantity', value: props.data.quantity?.toString() ?? ''},
      {name: 'isin', value: props.data.isin ?? ''},
      {name: 'averagePrice', value: props.data.averagePrice?.toString() ?? ''},
      {name: 'lastPriceDate', value: props.data.lastPriceDate ?? ''},
      {name: 'lastPrice', value: props.data.lastPrice?.toString() ?? ''},
      {name: 'xirr', value: props.data.xirr?.toString() ?? ''},
    ]}
  />
);

export {MutualFundsScreen};
