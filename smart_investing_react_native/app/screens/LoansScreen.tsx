import React, {useState, useContext} from 'react';
import {Text, View, ScrollView} from 'react-native';
import {alert, copyToClipboard} from '../apis/Functions';
import {ScButton, ScTextInput} from '../components/ScComponents';
import {EnvContext} from '../EnvProvider';
import {
  getUnityUserLoanSummary,
  createUnityInteractionToken,
  getUnityUser,
  createUnityUser,
} from '../apis/SmartInvestingService';
import {
  CreateUnityInteractionTokenPayload,
  GenerateUnityUserPayload,
} from '../models/Loans/ScLoanModels';
import {SIJsonViewer} from '../components/SIJsonViewer';
import {SmartButton} from './HoldingsScreen';
import {SIDropDown} from '../components/SIDropdown';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import {ScLoan} from 'react-native-smallcase-gateway';

type LoanSummaryType = Awaited<ReturnType<typeof getUnityUserLoanSummary>>;

// Color scheme passed to the LAS web UI. Index 0 ("None") omits colorScheme
// entirely so the SDK keeps its "partner sent nothing → light" default; the
// rest map to the primitive string the native bridge expects.
type ScLoanColorScheme = 'light' | 'dark' | 'system';
const COLOR_SCHEME_LABELS = ['None', 'Light', 'Dark', 'System'];
const COLOR_SCHEME_VALUES: (ScLoanColorScheme | undefined)[] = [
  undefined,
  'light',
  'dark',
  'system',
];

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
  const [offersInput] = useState<string>('');

  // Selected LAS color scheme; defaults to index 0 ("None").
  const [colorSchemeIndex, setColorSchemeIndex] = useState<number>(0);

  // Single source of truth for the ScLoanInfo passed to every trigger. When the
  // selected scheme is "None" we omit the key so the SDK applies its default.
  const buildLoanInfo = (token: string) => {
    const colorScheme = COLOR_SCHEME_VALUES[colorSchemeIndex];
    return colorScheme ? {interactionToken: token, colorScheme} : {interactionToken: token};
  };

  const [createUnityUserPayload, setCreateUnityUserPayload] =
    useState<GenerateUnityUserPayload>({
      id: '',
      pan: '',
      dob: '',
      lender: 'bajaj_finserv',
      authContact: {
        number: '',
        countryCode: '',
      },
      mfHoldings: null,
      bankAccounts: [],
      productType: '',
    });

  const syncLenderValue = (value: string) => {
    setCreateInteractionPayload(prevPayload => ({
      ...prevPayload,
      config: {
        ...prevPayload?.config,
        lender: value.length === 0 ? undefined : value,
      },
    }));
    setCreateUnityUserPayload(prevPayload => ({
      ...prevPayload,
      lender: value.length === 0 ? undefined : value,
    }));
  };

  const syncProductTypeValue = (value: string) => {
    setCreateInteractionPayload(prevPayload => ({
      ...prevPayload,
      config: {
        ...prevPayload?.config,
        productType: value.length === 0 ? undefined : value,
      },
    }));
    setCreateUnityUserPayload(prevPayload => ({
      ...prevPayload,
      productType: value.length === 0 ? undefined : value,
    }));
  };

  const syncOpaqueIDValue = (value: string) => {
    setCreateInteractionPayload(prevPayload => ({
      ...prevPayload,
      config: {
        ...prevPayload?.config,
        opaqueId: value.length === 0 ? undefined : value,
      },
    }));
    setCreateUnityUserPayload(prevPayload => ({
      ...prevPayload,
      id: value.length === 0 ? undefined : value,
    }));
  };

  const getUser = async (id: string) => {
    try {
      // Construct the request headers
      const headers = {
        Accept: 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
        Origin: 'https://dev.smartinvesting.io',
        Referer: 'https://dev.smartinvesting.io/',
        Cookie: `idToken=${state.idToken}; refreshToken=${state.refreshToken}`, // Ensure tokens are available in state
      };

      // Perform the request with custom headers
      const res = await getUnityUser(state.env, id, headers);
      console.log('Raw Response:', res); // Print raw response before parsing

      // Parse the response JSON
      const jsonRes = JSON.parse(res);
      console.log('Parsed JSON Response:', jsonRes); // Print full parsed JSON response

      // Update state with the user data
      setUnityUserInfo(jsonRes.data);

      // Update the interaction payload
      setCreateInteractionPayload(prevPayload => ({
        ...prevPayload,
        config: {
          ...prevPayload?.config,
          userId: jsonRes.data.lasUserId,
          opaqueId: jsonRes.data.opaqueId,
        },
      }));

      console.log(`Unity User: ${JSON.stringify(jsonRes.data, null, 2)}`); // Pretty print user data
    } catch (error) {
      console.error(`Unity User Error: ${error}`);
    }
  };

  const createInteraction = async () => {
    if (!createInteractionPayload) {
      return;
    }
    let offersArray = [];
    if (offersInput) {
      try {
        offersArray = JSON.parse(offersInput);
        if (!Array.isArray(offersArray)) {
          throw new Error('Offers should be a JSON array');
        }
      } catch (error) {
        alert('Invalid JSON', 'Please enter a valid JSON array for offers.');
        return;
      }
    }

    const updatedPayload = {
      ...createInteractionPayload,
      config: {
        ...createInteractionPayload.config,
        offers: offersArray,
      },
    };

    try {
      const res = await createUnityInteractionToken(state.env, updatedPayload);
      alert('Success', res);
      const resJson = JSON.parse(res);
      setInteractionToken(resJson.data.interactionToken);
    } catch (error) {
      console.error('Error creating interaction:', error);
    }
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
      setCreateInteractionPayload(prevPayload => ({
        ...prevPayload,
        config: {
          ...prevPayload?.config,
          lid: loanSummary?.data.journeyStatus.loans[0].lid,
        },
      }));
    } catch (error: any) {
      console.log('getLoanSummary error:', error);
      alert('Error', `${error}, ${JSON.stringify(error.userInfo)}`);
    }
  };

  const applyForLoan = async () => {
    try {
      if (typeof interactionToken !== 'string') {
        throw new Error('Invalid interaction token!');
      }
      const applyRes = await ScLoan.apply(buildLoanInfo(interactionToken));
      alert('Success', `${JSON.stringify(applyRes)}`);
    } catch (error: any) {
      alert('Error', `${error}, ${JSON.stringify(error.userInfo)}`);
    }
  };

  const payAmount = async () => {
    try {
      if (typeof interactionToken !== 'string') {
        throw new Error('Invalid interaction token!');
      }
      const payRes = await ScLoan.pay(buildLoanInfo(interactionToken));
      alert('Success', `${JSON.stringify(payRes)}`);
    } catch (error: any) {
      alert('Error', `${error}, ${JSON.stringify(error.userInfo)}`);
    }
  };

  const withdrawAmount = async () => {
    try {
      if (typeof interactionToken !== 'string') {
        throw new Error('Invalid interaction token!');
      }
      const withdrawRes = await ScLoan.withdraw(buildLoanInfo(interactionToken));
      alert('Success', `${JSON.stringify(withdrawRes)}`);
    } catch (error: any) {
      alert('Error', `${error}, ${JSON.stringify(error.userInfo)}`);
    }
  };

  const service = async () => {
    try {
      if (typeof interactionToken !== 'string') {
        throw new Error('Invalid interaction token!');
      }
      const serviceRes = await ScLoan.service(buildLoanInfo(interactionToken));
      alert('Success', `${JSON.stringify(serviceRes)}`);
    } catch (error: any) {
      alert('Error', `${error}, ${JSON.stringify(error.userInfo)}`);
    }
  };

  const triggerInteraction = async () => {
    try {
      if (typeof interactionToken !== 'string') {
        throw new Error('Invalid interaction token!');
      }
      const serviceRes = await ScLoan.triggerInteraction(
        buildLoanInfo(interactionToken),
      );
      alert('Success', `${JSON.stringify(serviceRes)}`);
    } catch (error: any) {
      alert('Error', `${error}, ${JSON.stringify(error.userInfo)}`);
    }
  };

  const createUnityUserFunc = async () => {
    try {
      const res = await createUnityUser(state.env, createUnityUserPayload);
      alert('Success', `${JSON.stringify(res)}`);
    } catch (error: any) {
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
                userId: value.length === 0 ? undefined : value,
              },
            });
          }}
          placeholder={'userId'}
        />
        <ScTextInput
          onChanged={value => {
            setCreateInteractionPayload({
              ...createInteractionPayload,
              config: {
                ...createInteractionPayload?.config,
                lender: value.length === 0 ? undefined : value,
              },
            });
          }}
          placeholder={'lender'}
        />
        <ScTextInput
          onChanged={value => {
            setCreateInteractionPayload({
              ...createInteractionPayload,
              config: {
                ...createInteractionPayload?.config,
                opaqueId: value.length === 0 ? undefined : value,
              },
            });
          }}
          placeholder={'opaqueId'}
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
        <ScTextInput
          onChanged={value => {
            syncLenderValue(value);
          }}
          placeholder={'Lender'}
        />
        <ScTextInput
          onChanged={value => {
            syncProductTypeValue(value);
          }}
          placeholder={'productType'}
        />
        <ScTextInput
          onChanged={value => {
            setCreateInteractionPayload({
              ...createInteractionPayload,
              config: {
                ...createInteractionPayload?.config,
                assetType: value.length === 0 ? undefined : value,
              },
            });
          }}
          placeholder={'assetType'}
        />
        <ScTextInput
          onChanged={value => {
            setCreateInteractionPayload({
              ...createInteractionPayload,
              config: {
                ...createInteractionPayload?.config,
                userId: value.length === 0 ? undefined : value,
              },
            });
          }}
          placeholder={'userId'}
        />
        <ScTextInput
          onChanged={value => {
            syncOpaqueIDValue(value);
          }}
          placeholder={'opaqueId'}
        />
      </View>

      {/* New input field for offers JSON array */}
      <ScTextInput
        onChanged={value => {
          setCreateInteractionPayload({
            ...createInteractionPayload,
            offers: value.length === 0 ? undefined : JSON.parse(value), // Put offers outside config
            config: {
              ...createInteractionPayload?.config,
            },
          });
        }}
        placeholder={'Paste Offers JSON'}
        style={{
          height: 150,
          width: '100%',
          padding: 10,
          borderColor: '#ccc',
          borderWidth: 1,
        }}
      />

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
            alert('Error', `${error}, ${JSON.stringify(error.userInfo)}`);
          }
        }}
        title={'Setup'}
      />
      <View style={{height: 12, backgroundColor: 'transparent'}} />
      <Text style={{fontSize: 14, fontWeight: 'bold', marginBottom: 6}}>
        Color Scheme
      </Text>
      <SegmentedControl
        values={COLOR_SCHEME_LABELS}
        selectedIndex={colorSchemeIndex}
        onChange={event => {
          setColorSchemeIndex(event.nativeEvent.selectedSegmentIndex);
        }}
      />
      <View style={{height: 12, backgroundColor: 'transparent'}} />
      <ScButton onPress={applyForLoan} title={'Apply'} />
      <ScButton onPress={payAmount} title={'Pay'} />
      <ScButton onPress={withdrawAmount} title={'Withdraw'} />
      <ScButton onPress={service} title={'Service'} />
      <ScButton onPress={triggerInteraction} title={'Trigger Interaction'} />
      <View style={{height: 20, backgroundColor: 'transparent'}} />
      <Text style={{fontSize: 16, fontWeight: 'bold'}}>Create Unity User</Text>
      <ScTextInput
        onChanged={value => {
          setCreateUnityUserPayload({
            ...createUnityUserPayload,
            pan: value,
          });
        }}
        placeholder="Enter PAN"
      />
      <ScTextInput
        onChanged={value => {
          setCreateUnityUserPayload({
            ...createUnityUserPayload,
            dob: value,
          });
        }}
        placeholder="Enter DOB"
      />
      <ScTextInput
        onChanged={value => {
          setCreateUnityUserPayload({
            ...createUnityUserPayload,
            authContact: {
              ...createUnityUserPayload.authContact,
              number: value,
            },
          });
        }}
        placeholder="Enter Contact Number"
      />
      <ScTextInput
        onChanged={value => {
          setCreateUnityUserPayload({
            ...createUnityUserPayload,
            authContact: {
              ...createUnityUserPayload.authContact,
              countryCode: value,
            },
          });
        }}
        placeholder="Enter Country Code"
      />
      <SIJsonViewer
        title={'Create Unity User Payload'}
        object={createUnityUserPayload}
      />
      <ScButton onPress={createUnityUserFunc} title="Create Unity User" />
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
            key={loan.lid}
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
