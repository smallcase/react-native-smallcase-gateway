/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {useState} from 'react';
import {Environment} from './apis/SmartInvestingService';
import {HoldingsData, HoldingsDataV2} from './models/HoldingsModels';
import {prodEnv} from './screens/ConnectScreen';

const EnvContext = React.createContext<{
  env: Environment;
  userId: string;
  setEnv: (env: Environment) => void;
  setUserId: (id: string) => void;
  isConnected: boolean;
  setIsConnected: (value: boolean) => void;
  holdings: null | HoldingsData | HoldingsDataV2;
  setHoldings: (holdings: HoldingsData | HoldingsDataV2 | null) => void;
}>({
  env: prodEnv,
  userId: '',
  setEnv: (env: Environment) => {},
  setUserId: (id: string) => {},
  isConnected: false,
  setIsConnected: (value: boolean) => {},
  holdings: null,
  setHoldings: (holdings: HoldingsData | HoldingsDataV2 | null) => {},
});

const EnvProvider = (props: {
  children:
    | boolean
    | React.ReactChild
    | React.ReactFragment
    | React.ReactPortal
    | null
    | undefined;
}) => {
  const [env, setEnv] = useState(prodEnv);
  const [userId, setUserId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [holdings, setHoldings] = useState<
    HoldingsData | HoldingsDataV2 | null
  >(null);

  return (
    <EnvContext.Provider
      value={{
        env,
        userId,
        setEnv,
        setUserId,
        isConnected,
        setIsConnected,
        holdings,
        setHoldings,
      }}>
      {props.children}
    </EnvContext.Provider>
  );
};

export {EnvContext, EnvProvider};
