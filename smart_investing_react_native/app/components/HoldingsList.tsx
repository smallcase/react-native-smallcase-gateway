import React, {useContext} from 'react';
import {
  Button,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {EnvContext} from '../EnvProvider';
import {
  Holding,
  HoldingsData,
  HoldingsDataV2,
  SecurityV2,
} from '../models/HoldingsModels';
import {TableRow, TableSection} from './Table';

type SectionListData = Section[];
interface SmallcaseItemProps {
  imgUrl: string | null;
  name: string;
  currVal: string;
  totRet: string;
}
class Section {
  title: string;
  data: Data[];

  constructor(title: string, data: Data[]) {
    this.title = title;
    this.data = data;
  }
}
class Data {
  type: number;
  imgUrl: string | null;
  name: string;
  desc: string | null;
  currValue: number | null;
  totReturns: number | null;

  constructor(
    type: number,
    imgUrl: string | null,
    name: string,
    desc: string | null,
    currValue: number | null,
    totReturns: number | null,
  ) {
    this.type = type;
    this.imgUrl = imgUrl;
    this.name = name;
    this.desc = desc;
    this.currValue = currValue;
    this.totReturns = totReturns;
  }
}

function getSectionListData(hData: HoldingsData): SectionListData {
  const publicSmallcases = hData?.smallcases?.public?.map(s => {
    return {
      name: s.name,
      desc: s.shortDescription,
      imgUrl: s.imageUrl,
      currValue: s.stats.currentValue,
      totReturns: s.stats.totalReturns,
      type: 1,
    };
  });
  const pvtSmallcases = [
    new Data(
      2,
      null,
      'v1 pvt data',
      null,
      hData?.smallcases?.private?.stats?.currentValue!,
      hData?.smallcases?.private?.stats?.totalReturns!,
    ),
  ];

  const holdings = hData?.securities?.holdings.map(h => {
    return new Data(0, null, h.name, null, h.shares, h.averagePrice);
  });

  const sectionListData: SectionListData = [
    new Section('Securities', holdings!),
    new Section('Public Smallcases', publicSmallcases!),
    new Section('Pvt. Smallcases', pvtSmallcases!),
  ];
  return sectionListData;
}

function getSectionListDataV2(hData: HoldingsDataV2): SectionListData {}

const UserHoldingsScreen = ({route, navigation}) => {
  const state = useContext(EnvContext);
  const holdings = state.holdings;
  const {version} = route.params;

  console.log(`UserHoldingsScreen data: ${holdings}, type: ${holdings}`);

  function doesMFExist() {
    console.log(`mfDebug ${holdings?.mutualFunds}`);
    console.log(`mfDebug ${holdings?.mutualFunds?.holdings}`);
    return (
      holdings?.mutualFunds?.holdings?.length !== 0 &&
      holdings?.mutualFunds !== null &&
      holdings?.mutualFunds !== undefined &&
      holdings?.mutualFunds?.holdings !== undefined &&
      holdings?.mutualFunds?.holdings !== null
    );
  }

  return holdings === null ? (
    <Text style={styles.header}>No Holdings</Text>
  ) : (
    <>
      {doesMFExist() ? (
        <Button
          title="Show Mutual Funds"
          onPress={() => {
            navigation.navigate('MutualFundsScreen');
          }}
        />
      ) : (
        <></>
      )}
      {version === 1 ? (
        <HoldingsList
          smallcases={holdings?.smallcases!}
          securities={holdings?.securities!}
          updating={holdings?.updating!}
          lastUpdate={holdings?.lastUpdate!}
          snapshotDate={holdings?.snapshotDate!}
          smallcaseAuthId={holdings?.smallcaseAuthId!}
          broker={holdings?.broker!}
        />
      ) : (
        <HoldingsListV2
          securities={holdings.securities}
          smallcases={holdings.smallcases}
          lastUpdate={holdings.lastUpdate}
          snapshotDate={holdings.snapshotDate}
          updating={holdings.updating}
        />
      )}
    </>
  );
};

const HoldingsListV2 = (data: HoldingsDataV2) => {
  console.log(`Debug holdings: ${typeof data.securities[0].holdings}`);
  return (
    <ScrollView>
      <Text style={styles.header}>Securities</Text>
      {data.securities.map(security => (
        <SecurityItemV2
          name={security.name}
          bseTicker={security.bseTicker}
          nseTicker={security.nseTicker}
          smallcaseQuantity={security.smallcaseQuantity}
          transactableQuantity={security.transactableQuantity}
          isin={security.isin}
          positions={security.positions}
          holdings={security.holdings}
        />
      ))}
      <Text style={styles.header}>Public Smallcases</Text>
      {data.smallcases?.public?.map(pub => (
        <SectionItem
          imgUrl={pub.imageUrl}
          name={pub.name ?? ''}
          currVal={(pub.stats.currentValue ?? -1).toString()}
          totRet={(pub.stats.totalReturns ?? -1).toString()}
        />
      ))}
      <Text style={styles.header}>Private Smallcases</Text>
      {data.smallcases?.privateV2?.investments?.map(priv => (
        <SectionItem
          imgUrl={priv.imageUrl}
          name={priv.name ?? ''}
          currVal={(priv.stats.currentValue ?? -1).toString()}
          totRet={(priv.stats.totalReturns ?? -1).toString()}
        />
      ))}
    </ScrollView>
  );
};

const HoldingsList = (data: HoldingsData) => (
  <ScrollView style={styles.list}>
    <Text style={styles.header}>Securities</Text>
    {data.securities?.holdings.map(holding => (
      <HoldingItem
        title={`#${data.securities?.holdings.indexOf(holding)}`}
        holding={holding}
      />
    ))}
    <Text style={styles.header}>Public Smallcases</Text>
    {data.smallcases?.public?.map(pub => (
      <SectionItem
        imgUrl={pub.imageUrl}
        name={pub.name ?? ''}
        currVal={(pub.stats.currentValue ?? -1).toString()}
        totRet={(pub.stats.totalReturns ?? -1).toString()}
      />
    ))}
    <Text style={styles.header}>Private Smallcases</Text>
    {data.smallcases?.private?.map(priv => (
      <SectionItem
        imgUrl={priv.imageUrl}
        name={priv.name ?? ''}
        currVal={(priv.stats.currentValue ?? -1).toString()}
        totRet={(priv.stats.totalReturns ?? -1).toString()}
      />
    ))}
  </ScrollView>
);

const SectionItem = (data: SmallcaseItemProps) => (
  <TableSection
    title={`${data.name}`}
    rows={[
      {name: 'Desc.', value: data.imgUrl as string},
      {
        name: 'Cur Value: ',
        value: data.currVal,
      },
      {
        name: 'Total Returns: ',
        value: data.totRet,
      },
    ]}
  />
);

const SecurityItemV2 = (security: SecurityV2) => (
  <View style={styles.securityItemV2}>
    <TableRow name="Name" value={security.name} />
    <TableRow name="BSE Ticker" value={security.bseTicker} />
    <TableRow name="BSE Ticker" value={security.bseTicker} />
    <TableRow name="NSE Ticker" value={security.nseTicker} />
    <TableRow
      name="Smallcase Qty."
      value={security.smallcaseQuantity.toString()}
    />
    <TableRow
      name="Transactable Qty."
      value={security.transactableQuantity.toString()}
    />
    <TableRow name="IsIn" value={security.isin} />
    <HoldingItem title="Holdings" holding={security.holdings} />
    <HoldingItem title="BSE Position" holding={security.positions.bse} />
    <HoldingItem title="NSE Position" holding={security.positions.nse} />
  </View>
);

interface HoldingItemProps {
  title: string;
  holding: Holding;
}

const HoldingItem = (props: HoldingItemProps) => {
  console.log(`Holding Item - ${JSON.stringify(props.holding)}`);
  return (
    <TableSection
      title={props.title}
      rows={[
        {name: 'Name', value: props.holding.name},
        {
          name: 'Avg. Price',
          value:
            props.holding.averagePrice !== undefined
              ? props.holding.averagePrice.toString()
              : 'null',
        },
        {name: 'Ticker', value: props.holding.ticker.toString()},
        {name: 'Shares', value: props.holding.shares.toString()},
      ]}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    height: 150,
  },
  header: {
    fontSize: 24,
    backgroundColor: '#fff',
    fontWeight: 'bold',
  },
  securityItemV2: {
    margin: 4,
    padding: 4,
    borderColor: 'blue',
    backgroundColor: 'aliceblue',
    borderWidth: 1,
  },
});

export {HoldingsList, UserHoldingsScreen};
