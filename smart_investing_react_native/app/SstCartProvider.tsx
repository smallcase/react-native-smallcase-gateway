/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {useState} from 'react';
import {Security} from './models/SstModels';

// {
//     sstCart: Security[];
//     setSstCart: (securities: Security[]) => {};
//   }

interface SstCartProps {
  sstCart: Security[];
  setSstCart: (securities: Security[]) => void;
}

const SstCartContext = React.createContext({} as SstCartProps);

const SstCartProvider = (props: {
  children:
    | boolean
    | React.ReactChild
    | React.ReactFragment
    | React.ReactPortal
    | null
    | undefined;
}) => {
  const [sstCart, setSstCart] = useState<Security[]>([]);

  return (
    <SstCartContext.Provider value={{sstCart, setSstCart}}>
      {props.children}
    </SstCartContext.Provider>
  );
};

export {SstCartContext, SstCartProvider};
