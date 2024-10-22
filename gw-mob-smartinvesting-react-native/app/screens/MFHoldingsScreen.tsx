import React, {useContext} from 'react';
import {TextInput} from 'react-native';
import {SmartButton} from './HoldingsScreen';
import {getTransactionId, triggerMftxn, alert} from '../apis/Functions';
import {EnvContext} from '../EnvProvider';
import {Environment} from '../apis/SmartInvestingService';
import {postbackSearch} from '../apis/SmartInvestingService';

async function getMfTxnId(
  env: Environment,
  assetConfig: Object | null,
  notes: string,
) {
  const txnId = await getTransactionId(
    env,
    'MF_HOLDINGS_IMPORT',
    '',
    null,
    assetConfig,
    notes,
  );
  return txnId;
}

async function getMfHoldings(env: Environment, txnId: string) {
  const res = await postbackSearch(env, txnId);
  alert('MF Holdings Postback Response', JSON.stringify(res));
}
async function importMFHoldings(env: Environment, txnId: string) {
  await triggerMftxn(env, txnId);
  getMfHoldings(env, txnId);
}

const MFHoldingsScreen = ({}) => {
  const state = useContext(EnvContext);
  const env = state.env;
  let fromDate = '';
  let notes = '';
  let txnId = '';
  return (
    <>
      <TextInput
        placeholder="Enter notes"
        onChange={event => {
          notes = event.nativeEvent.text;
        }}
      />
      <TextInput
        placeholder="From date: YYYY-MM-DD"
        onChange={event => {
          fromDate = event.nativeEvent.text;
        }}
      />
      <SmartButton
        onPress={async () => {
          let assetConfig = null;
          if (fromDate.length !== 0) {
            assetConfig = {fromDate: fromDate};
          }
          const txnId = await getMfTxnId(env, assetConfig, notes);
          importMFHoldings(env, txnId);
        }}
        title={'Import MF Holdings'}
      />
      <TextInput
        placeholder="Enter TxnId"
        onChange={event => {
          txnId = event.nativeEvent.text;
        }}
      />
      <SmartButton
        onPress={async () => {
          getMfHoldings(env, txnId);
        }}
        title={'Postback Search'}
      />
      <SmartButton
        onPress={async () => {
          importMFHoldings(env, txnId);
        }}
        title={'Trigger mf txn'}
      />
    </>
  );
};

export {MFHoldingsScreen};
