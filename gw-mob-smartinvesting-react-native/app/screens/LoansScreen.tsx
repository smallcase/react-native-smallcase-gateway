/* eslint-disable react-native/no-inline-styles */
import React, {useState, useContext} from 'react';
import {Text, View, ScrollView} from 'react-native';
import {alert, copyToClipboard} from '../apis/Functions';
import {ScButton, ScTextInput} from '../components/ScComponents';
import {EnvContext} from '../EnvProvider';
import {
  getUnityUserLoanSummary,
  createUnityInteractionToken,
  getUnityUser,
} from '../apis/SmartInvestingService';
import {CreateUnityInteractionTokenPayload} from '../models/Loans/ScLoanModels';
import {SIJsonViewer} from '../components/SIJsonViewer';
import {SmartButton} from './HoldingsScreen';
import {SIDropDown} from '../components/SIDropdown';
import {ScLoan} from 'react-native-smallcase-gateway';
import * as Sentry from '@sentry/react-native';

type LoanSummaryType = Awaited<ReturnType<typeof getUnityUserLoanSummary>>;

export const basePayload = {
  intent: 'LOAN_APPLICATION',
  config: {
    lender: 'bajaj_finserv',
  },
};

const applyPayload = {
  ...basePayload,
  intent: 'LOAN_APPLICATION',
};
const withdrawPayload = {
  ...basePayload,
  intent: 'WITHDRAW',
};
const payPayload = {
  ...basePayload,
  intent: 'PAYMENT',
};
const servicePayload = {
  ...basePayload,
  intent: 'SERVICE',
};

const LoansScreen = ({route}: {route: any}) => {
  const state = useContext(EnvContext);
  const {gatewayName, environment} = route.params.config;

  console.log(`Loans user screen received: ${gatewayName} ${environment}`);

  const [smartInvestingUserId, setSmartInvestingUserId] = useState<string>();
  const [unityUserInfo, setUnityUserInfo] = useState<any>();

  const [createInteractionPayload, setCreateInteractionPayload] = useState<
    undefined | CreateUnityInteractionTokenPayload
  >(applyPayload);

  const [interactionToken, setInteractionToken] = useState<string | undefined>(
    undefined,
  );
  const [loanSummary, setLoanSummary] = useState<LoanSummaryType>();

  const getUser = async (id: string) => {
    try {
      const res = await getUnityUser(state.env, id);
      const jsonRes = JSON.parse(res);
      setUnityUserInfo(jsonRes.data);
      setCreateInteractionPayload({
        ...createInteractionPayload,
        config: {
          ...createInteractionPayload?.config,
          userId: jsonRes.data.lasUserId,
          opaqueId: jsonRes.data.opaqueId,
        },
      });
      console.log(`Unity User ${JSON.stringify(jsonRes.data)}`);
    } catch (error) {
      Sentry.captureException(error);
      console.log(`Unity User Error ${error}`);
    }
  };

  const createInteraction = async () => {
    if (!createInteractionPayload) {
      return;
    }
    const res = await createUnityInteractionToken(
      state.env,
      createInteractionPayload,
    );
    alert('Success', res);
    const resJson = JSON.parse(res);
    setInteractionToken(resJson.data.interactionToken);
    console.log(`Loans User Screen: interaction token = ${interactionToken}`);
  };

  const getLoanSummary = async () => {
    try {
      if (!unityUserInfo) {
        alert(
          'Invalid operation',
          'Loan Summary is not supported for guest user',
        );
        return;
      }
      const loanSummaryRes = await getUnityUserLoanSummary(
        state.env,
        unityUserInfo.lasUserId,
      );
      setLoanSummary(loanSummaryRes);
      setCreateInteractionPayload({
        ...createInteractionPayload,
        config: {
          ...createInteractionPayload?.config,
          lid: loanSummary?.data.journeyStatus.loans[0].lid,
        },
      });
    } catch (error: any) {
      Sentry.captureException(error);
      console.log('getLoanSumary error:', error);
      alert('Error', `${error}, ${JSON.stringify(error.userInfo)}`);
    }
  };

  const applyForLoan = async () => {
    try {
      if (typeof interactionToken !== 'string') {
        throw new Error('Invalid intercation token!');
      }
      const applyRes = await ScLoan.apply({
        interactionToken: interactionToken,
      });
      alert('Success', `${JSON.stringify(applyRes)}`);
    } catch (error: any) {
      Sentry.captureException(error);
      alert('Error', `${error}, ${JSON.stringify(error.userInfo)}`);
    }
  };

  const payAmount = async () => {
    try {
      if (typeof interactionToken !== 'string') {
        throw new Error('Invalid intercation token!');
      }
      const payRes = await ScLoan.pay({
        interactionToken: interactionToken,
      });
      alert('Success', `${JSON.stringify(payRes)}`);
    } catch (error: any) {
      Sentry.captureException(error);
      alert('Error', `${error}, ${JSON.stringify(error.userInfo)}`);
    }
  };

  const withdrawAmount = async () => {
    try {
      if (typeof interactionToken !== 'string') {
        throw new Error('Invalid intercation token!');
      }
      const withdrawRes = await ScLoan.withdraw({
        interactionToken: interactionToken,
      });
      alert('Success', `${JSON.stringify(withdrawRes)}`);
    } catch (error: any) {
      Sentry.captureException(error);
      alert('Error', `${error}, ${JSON.stringify(error.userInfo)}`);
    }
  };

  const service = async () => {
    try {
      if (typeof interactionToken !== 'string') {
        throw new Error('Invalid intercation token!');
      }
      const serviceRes = await ScLoan.service({
        interactionToken: interactionToken,
      });
      alert('Success', `${JSON.stringify(serviceRes)}`);
    } catch (error: any) {
      Sentry.captureException(error);
      alert('Error', `${error}, ${JSON.stringify(error.userInfo)}`);
    }
  };

  const triggerInteraction = async () => {
    try {
      if (typeof interactionToken !== 'string') {
        throw new Error('Invalid interaction token!');
      }
      const serviceRes = await ScLoan.triggerInteraction({
        interactionToken: interactionToken,
      });
      alert('Success', `${JSON.stringify(serviceRes)}`);
    } catch (error: any) {
      Sentry.captureException(error);
      alert('Error', `${error}, ${JSON.stringify(error.userInfo)}`);
    }
  };

  return (
    <ScrollView style={{paddingHorizontal: 10, paddingVertical: 8}}>
      <View style={{paddingVertical: 6}}>
        {unityUserInfo ? (
          <>
            <SIJsonViewer
              title={`User (${unityUserInfo.lasUserId})`}
              object={unityUserInfo}
            />
            {loanSummary == null ? null : <LoanSummary {...loanSummary} />}
            <ScButton title={'Get Loan Summary'} onPress={getLoanSummary} />
          </>
        ) : (
          <Text style={{fontSize: 16, fontWeight: 'bold'}}>Guest</Text>
        )}
      </View>

      <ScTextInput
        onChanged={value => {
          setSmartInvestingUserId(value);
        }}
        placeholder="Enter SI UserID"
      />
      <SmartButton
        title={'Find Existing User'}
        onPress={() => {
          if (!smartInvestingUserId) {
            return;
          }
          getUser(smartInvestingUserId);
        }}
      />

      <View style={{height: 20, backgroundColor: 'transparent'}} />
      <View style={{gap: 4}}>
        <SIDropDown<{intent: string; config: {lender: string}}>
          labelField={'intent'}
          valueField={'intent'}
          defaultValue={applyPayload}
          data={[applyPayload, withdrawPayload, payPayload, servicePayload]}
          onChange={item => {
            setCreateInteractionPayload({
              ...createInteractionPayload,
              intent: item.intent,
              config: {
                ...createInteractionPayload?.config,
                ...item.config,
              },
            });
            console.log(`Dropdown onchange ${JSON.stringify(item)}`);
          }}
        />
        <ScTextInput
          value={createInteractionPayload?.intent}
          onChanged={value => {
            setCreateInteractionPayload({
              ...createInteractionPayload,
              intent: value.length === 0 ? undefined : value,
            });
          }}
          placeholder={'Intent'}
        />

        <ScTextInput
          onChanged={value => {
            setCreateInteractionPayload({
              ...createInteractionPayload,
              config: {
                ...createInteractionPayload?.config,
                amount: value.length === 0 ? undefined : value,
              },
            });
          }}
          placeholder={'Amount'}
        />
        <ScTextInput
          onChanged={value => {
            setCreateInteractionPayload({
              ...createInteractionPayload,
              config: {
                ...createInteractionPayload?.config,
                type: value.length === 0 ? undefined : value,
              },
            });
          }}
          placeholder={'Type'}
        />
      </View>

      <SIJsonViewer
        title={'Create Interaction Payload'}
        object={createInteractionPayload}
      />

      <ScButton onPress={createInteraction} title="Create Interaction" />
      <ScTextInput
        value={interactionToken}
        onChanged={value => {
          setInteractionToken(value);
        }}
        placeholder="Enter Interaction Token"
      />
      <ScButton
        onPress={async () => {
          try {
            const res = await ScLoan.setup({
              gatewayName,
              environment,
            });
            alert('Success', `${JSON.stringify(res)}`);
          } catch (error: any) {
            Sentry.captureException(error);
            alert('Error', `${error}, ${JSON.stringify(error.userInfo)}`);
          }
        }}
        title={'Setup'}
      />
      <ScButton onPress={applyForLoan} title={'Apply'} />
      <ScButton onPress={payAmount} title={'Pay'} />
      <ScButton onPress={withdrawAmount} title={'Withdraw'} />
      <ScButton onPress={service} title={'Service'} />
      <ScButton onPress={triggerInteraction} title={'Trigger Interaction'} />
    </ScrollView>
  );
};

const LoanSummary: React.FC<LoanSummaryType> = (
  loanSummary: LoanSummaryType,
) => {
  return (
    <>
      {loanSummary.data.journeyStatus.loans.map(loan => {
        return (
          <View
            style={{
              display: 'flex',
              marginVertical: 4,
              padding: 8,
              backgroundColor: 'rgba(89, 115, 227, 0.3)',
            }}>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <Text>lid: {loan.lid}</Text>
              <ScButton
                title="Copy"
                onPress={() => {
                  copyToClipboard(loan.lid);
                }}
              />
            </View>
            <Text>Status: {loan.status}</Text>
            <Text>Type: {loan.type}</Text>
          </View>
        );
      })}
    </>
  );
};

export {LoansScreen};
