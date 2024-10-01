import React, {useContext, useEffect, useState} from 'react';
import {ScrollView, StyleSheet, Switch, Text, View} from 'react-native';
import {alert} from '../apis/Functions';
import {ScButton, ScTextInput} from '../components/ScComponents';
import {
  BankAccount,
  Contact,
  ContactsPayload,
  MFHolding,
} from '../models/Loans/ScLoanModels';
import {createUnityUser, getUnityUser} from '../apis/SmartInvestingService';
import {EnvContext} from '../EnvProvider';
import * as Sentry from '@sentry/react-native';

const LoansCreateUserScreen: React.FC<any> = (props: {route; navigation}) => {
  const scLoanConfig = props.route.params.config;
  const gatewayName = scLoanConfig.gatewayName;
  const environment = scLoanConfig.environment;

  // console.log(`LoansScreen: ScLoan config: ${JSON.stringify(scLoanConfig)}`);

  const state = useContext(EnvContext);

  const [opaqueId, setOpaqueId] = useState<string | null>(null);
  const [lender, setLender] = useState<string | null>(null);

  const [pan, setPan] = useState<string | null>(null);
  const [dob, setDob] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [id2, setId2] = useState<string | null>(null);

  //Contact Details
  //------> Phone
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isPhoneNumberVerified, setIsPhoneNumberVerified] = useState(false);
  const [isPhoneNumberPrimary, setIsPhoneNumberPrimary] = useState(false);
  const toggleIsPhoneNumberVerified = () =>
    setIsPhoneNumberVerified(previousState => !previousState);
  const toggleIsPhoneNumberPrimary = () =>
    setIsPhoneNumberPrimary(previousState => !previousState);

  //------> Email
  const [email, setEmail] = useState<string | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isEmailPrimary, setIsEmailPrimary] = useState(false);
  const toggleIsEmailVerified = () =>
    setIsEmailVerified(previousState => !previousState);
  const toggleIsEmailPrimary = () =>
    setIsEmailPrimary(previousState => !previousState);

  //------> MF Holdings
  const [mfHoldings, setMFHoldings] = useState<MFHolding[]>([]);
  const [repository, setRepository] = useState<string | null>(null);
  const [amcCode, setAmcCode] = useState<string | null>(null);
  const [folio, setFolio] = useState<string | null>(null);
  const [schemeCode, setSchemeCode] = useState<string | null>(null);
  const [schemeName, setSchemeName] = useState<string | null>(null);
  const [isin, setIsin] = useState<string | null>(null);
  const [schemeType, setSchemeType] = useState<string | null>(null);
  const [units, setUnits] = useState<number | null>(null);

  //------> Bank Accounts
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [accountNumber, setAccountNumber] = useState<string | null>(null);
  const [ifscCode, setIFSCCode] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<string | null>(null);
  const [isBankAccountPrimary, setIsBankAccountPrimary] = useState(false);
  const toggleIsBankAccountPrimary = () =>
    setIsBankAccountPrimary(previousState => !previousState);

  //------> LienMarking
  const [isLienMarkingMocked, setIsLienMarkingMocked] = useState(false);
  const toggleIsLienMarkingMocked = () =>
    setIsLienMarkingMocked(previousState => !previousState);

  useEffect(() => {
    console.log('Bank Accounts:');
    console.log(bankAccounts);

    console.log('MFHoldings');
    console.log(mfHoldings);
  }, [bankAccounts, mfHoldings]);

  const continueWithGuestUser = async () => {
    props.navigation.navigate('LoansUserScreen', {
      mode: 'GUEST',
      gatewayName: gatewayName,
      environment: environment,
      opaqueId: opaqueId,
      lender: lender,
    });
  };

  const createNewUser = async () => {
    try {
      let phoneContact: Contact | undefined;
      let contacts: Contact[] = [];
      if (phoneNumber && phoneNumber.trim() !== '') {
        phoneContact = {
          type: 'PHONE',
          phone: {
            number: phoneNumber,
            countryCode: '+91',
          },
          isVerified: isPhoneNumberVerified,
          isPrimary: isPhoneNumberPrimary,
        };
        // console.log(phoneContact);
        contacts.push(phoneContact);
      }

      let emailContact: Contact | undefined;
      if (email && email.trim() !== '') {
        emailContact = {
          type: 'EMAIL',
          email: email,
          isVerified: isEmailVerified,
          isPrimary: isEmailPrimary,
        };
        // console.log(emailContact);
        contacts.push(emailContact);
      }

      const contactPayload: ContactsPayload = {
        contacts: [],
      };

      if (phoneContact) {
        contactPayload.contacts.push(phoneContact);
      }
      if (emailContact) {
        contactPayload.contacts.push(emailContact);
      }

      const payload = {
        id: userId,
        pan: pan,
        dob: dob,
        contacts: contacts,
        mfHoldings: mfHoldings,
        bankAccounts: bankAccounts,
        lender: lender,
        isLienMarkingMocked: isLienMarkingMocked,
      };

      console.log(`create unity user payload: ${JSON.stringify(payload)}`);

      const res = await createUnityUser(state.env, payload);
      const resJson = JSON.parse(res);

      props.navigation.navigate('LoansUserScreen', {
        mode: 'NEW',
        gatewayName: gatewayName,
        environment: environment,
        opaqueId: resJson.data.opaqueId === null ? '' : opaqueId,
        lender: lender === null ? '' : lender,
        lasUserId:
          resJson.data.lasUserId === null ? '' : resJson.data.lasUserId,
      });
      alert('Success', `${JSON.stringify(res)}`);
    } catch (error: any) {
      Sentry.captureException(error);
      alert('Error', `${error}, ${JSON.stringify(error.userInfo)}`);
    }
  };

  const addBankAccount = () => {
    let newBankAccount: BankAccount;
    if (accountNumber && accountNumber.trim() !== '') {
      newBankAccount = {
        accountNumber: accountNumber,
        ifscCode: ifscCode,
        accountType: accountType,
        primary: isBankAccountPrimary,
      };
      // bankAccounts.push(bankAccount);
      console.log(`adding new bank account ${newBankAccount}`);
      setBankAccounts(prevAccounts => [...prevAccounts, newBankAccount]);
    }
  };

  const addMFHolding = () => {
    let newMfHolding: MFHolding;
    if (repository && repository.trim() !== '') {
      newMfHolding = {
        repository: repository,
        amcCode: amcCode,
        folio: folio,
        schemeCode: schemeCode,
        schemeName: schemeName,
        isin: isin,
        schemeType: schemeType,
        units: units,
      };
      console.log(`adding new MFHoldings ${newMfHolding}`);
      setMFHoldings(prevHoldings => [...prevHoldings, newMfHolding]);
    }
  };

  const getUser = async () => {
    try {
      const res = await getUnityUser(state.env, id2);
      const resJson = JSON.parse(res);
      props.navigation.navigate('LoansUserScreen', {
        mode: 'EXISTING',
        gatewayName: gatewayName,
        environment: environment,
        opaqueId: resJson.data.opaqueId === null ? '' : opaqueId,
        lender: lender === null ? '' : lender,
        lasUserId:
          resJson.data.lasUserId === null ? '' : resJson.data.lasUserId,
      });
      alert('Success', res);
    } catch (error: any) {
      Sentry.captureException(error);
      alert('Error', `${error}, ${JSON.stringify(error.userInfo)}`);
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.scrollViewContainer}>
      <View style={{paddingHorizontal: 10, paddingVertical: 8}}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'center',
            alignSelf: 'center',
          }}>
          Guest User
        </Text>
        <ScTextInput
          onChanged={value => {
            setOpaqueId(value);
          }}
          placeholder={'Enter Opaque Id'}
        />
        <View style={{height: 10, backgroundColor: 'transparent'}} />
        <ScTextInput
          onChanged={value => {
            setLender(value);
          }}
          placeholder={'Lender'}
        />

        <View style={{height: 10, backgroundColor: 'transparent'}} />
        <ScButton
          onPress={continueWithGuestUser}
          title={'Continue with Guest User'}
        />
        <View style={{height: 20, backgroundColor: 'transparent'}} />

        <ScTextInput
          onChanged={value => {
            setPan(value);
          }}
          placeholder={'Enter PAN'}
        />
        <View style={{height: 10, backgroundColor: 'transparent'}} />
        <ScTextInput
          onChanged={value => {
            setDob(value);
          }}
          placeholder={'Enter DOB'}
        />
        <View style={{height: 10, backgroundColor: 'transparent'}} />

        <Text style={{fontSize: 14, fontWeight: 'bold'}}>Contact Details</Text>
        <Text style={{fontSize: 12, fontWeight: 'bold'}}>Phone</Text>
        <View style={{height: 10, backgroundColor: 'transparent'}} />
        <ScTextInput
          onChanged={value => {
            setPhoneNumber(value);
          }}
          placeholder={'Number'}
        />
        <View style={styles.rowContainer}>
          <Text>Is Primary:</Text>
          <Switch
            trackColor={{false: '#767577', true: '#81b0ff'}}
            thumbColor={isPhoneNumberPrimary ? '#f5dd4b' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleIsPhoneNumberPrimary}
            value={isPhoneNumberPrimary}
          />
        </View>
        <View style={styles.rowContainer}>
          <Text>Is Verified:</Text>
          <Switch
            trackColor={{false: '#767577', true: '#81b0ff'}}
            thumbColor={isPhoneNumberVerified ? '#f5dd4b' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleIsPhoneNumberVerified}
            value={isPhoneNumberVerified}
          />
        </View>
        <View style={{height: 10, backgroundColor: 'transparent'}} />
        <Text style={{fontSize: 12, fontWeight: 'bold'}}>Email</Text>
        <ScTextInput
          onChanged={value => {
            setEmail(value);
          }}
          placeholder={'Email'}
        />
        <View style={styles.rowContainer}>
          <Text>Is Primary:</Text>
          <Switch
            trackColor={{false: '#767577', true: '#81b0ff'}}
            thumbColor={isEmailPrimary ? '#f5dd4b' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleIsEmailPrimary}
            value={isEmailPrimary}
          />
        </View>
        <View style={styles.rowContainer}>
          <Text>Is Verified:</Text>
          <Switch
            trackColor={{false: '#767577', true: '#81b0ff'}}
            thumbColor={isEmailVerified ? '#f5dd4b' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleIsEmailVerified}
            value={isEmailVerified}
          />
        </View>
        <Text style={{fontSize: 14, fontWeight: 'bold'}}>MF Holdings</Text>
        <View style={{height: 10, backgroundColor: 'transparent'}} />
        <ScTextInput
          onChanged={value => {
            setRepository(value);
          }}
          placeholder={'Repository'}
        />
        <View style={{height: 10, backgroundColor: 'transparent'}} />
        <ScTextInput
          onChanged={value => {
            setAmcCode(value);
          }}
          placeholder={'AMC Code'}
        />
        <View style={{height: 10, backgroundColor: 'transparent'}} />
        <ScTextInput
          onChanged={value => {
            setFolio(value);
          }}
          placeholder={'Folio'}
        />
        <View style={{height: 10, backgroundColor: 'transparent'}} />
        <ScTextInput
          onChanged={value => {
            setSchemeCode(value);
          }}
          placeholder={'Scheme Code'}
        />
        <View style={{height: 10, backgroundColor: 'transparent'}} />
        <ScTextInput
          onChanged={value => {
            setSchemeName(value);
          }}
          placeholder={'Scheme Name'}
        />
        <View style={{height: 10, backgroundColor: 'transparent'}} />
        <ScTextInput
          onChanged={value => {
            setIsin(value);
          }}
          placeholder={'ISIN'}
        />
        <View style={{height: 10, backgroundColor: 'transparent'}} />
        <ScTextInput
          onChanged={value => {
            setSchemeType(value);
          }}
          placeholder={'Scheme Type'}
        />
        <View style={{height: 10, backgroundColor: 'transparent'}} />
        <ScTextInput
          onChanged={value => {
            setUnits(parseFloat(value));
          }}
          placeholder={'Units'}
        />
        <ScButton onPress={addMFHolding} title="Add MFHolding" />

        <View style={{height: 10, backgroundColor: 'transparent'}} />
        <Text style={{fontSize: 14, fontWeight: 'bold'}}>Bank Accounts</Text>
        <View style={{height: 10, backgroundColor: 'transparent'}} />
        <ScTextInput
          onChanged={value => {
            setAccountNumber(value);
          }}
          placeholder={'Account Number'}
        />
        <View style={{height: 10, backgroundColor: 'transparent'}} />
        <ScTextInput
          onChanged={value => {
            setIFSCCode(value);
          }}
          placeholder={'IFSC Code'}
        />
        <View style={{height: 10, backgroundColor: 'transparent'}} />
        <ScTextInput
          onChanged={value => {
            setAccountType(value);
          }}
          placeholder={'Account Type'}
        />
        <View style={styles.rowContainer}>
          <Text>Primary:</Text>
          <Switch
            trackColor={{false: '#767577', true: '#81b0ff'}}
            thumbColor={isBankAccountPrimary ? '#f5dd4b' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleIsBankAccountPrimary}
            value={isBankAccountPrimary}
          />
        </View>
        <ScButton onPress={addBankAccount} title="Add Bank Account" />
        <View style={{height: 10, backgroundColor: 'transparent'}} />

        <ScTextInput
          onChanged={value => {
            setUserId(value);
          }}
          placeholder={'Enter userId'}
        />
        <View style={styles.rowContainer}>
          <Text>Lien Marking Mocked:</Text>
          <Switch
            trackColor={{false: '#767577', true: '#81b0ff'}}
            thumbColor={isLienMarkingMocked ? '#f5dd4b' : '#f4f3f4'}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleIsLienMarkingMocked}
            value={isLienMarkingMocked}
          />
        </View>
        <ScButton title="Create New user" onPress={createNewUser} />
        <View style={{height: 10, backgroundColor: 'transparent'}} />
        <Text style={{fontSize: 14, fontWeight: 'bold'}}>Existing User</Text>
        <ScTextInput
          onChanged={value => {
            setId2(value);
          }}
          placeholder={'Enter existing opaqueId'}
        />
        <ScButton onPress={getUser} title="Get Existing User" />
        {/* <ScButton
        onPress={async () => {
          try {
            const res = await getUnityUser(state.env, id2);
            props.navigation.navigate('LoansUserScreen', {
              config: scLoanConfig,
              unityUserInfo: {
                lasUserId: res.lasUserId,
                opaqueId: res.opaqueId,
              },
            });
            // const res = await ScLoan.apply({
            //   interactionToken: interactionToken,
            // });
            // alert('Success', `${res}`);
          } catch (error: any) {
            alert('Error', `${error}, ${JSON.stringify(error.userInfo)}`);
          }
        }}
        title={'Get Existing User'}
      /> */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContainer: {
    flexGrow: 1,
    padding: 12,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingHorizontal: 16,
    paddingVertical: 8,
  },
  label: {
    marginRight: 8,
    fontSize: 14,
    fontWeight: 'medium',
  },
});

export {LoansCreateUserScreen};
