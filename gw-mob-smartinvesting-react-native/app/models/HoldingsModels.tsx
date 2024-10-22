class HoldingsData {
  smallcases: Smallcases | null = null;
  securities: Securities | null = null;
  updating: boolean | null = null;
  lastUpdate: number | null = null;
  snapshotDate: number | null = null;
  smallcaseAuthId: string | null = null;
  broker: string | null = null;
  mutualFunds: MutualFunds | null;

  constructor(
    smallcases: Smallcases | null,
    securities: Securities | null,
    updating: boolean,
    lastUpdate: number,
    snapshotDate: number,
    smallcaseAuthId: string,
    broker: string,
    mutualFunds: MutualFunds | null,
  ) {
    this.smallcases = smallcases;
    this.securities = securities;
    this.updating = updating;
    this.lastUpdate = lastUpdate;
    this.snapshotDate = snapshotDate;
    this.smallcaseAuthId = smallcaseAuthId;
    this.broker = broker;
    this.mutualFunds = mutualFunds;
  }

  static fromObj(data: Object) {
    if (data === null || data === undefined) {
      return null;
    }
    return new HoldingsData(
      Smallcases.fromObj(data.smallcases),
      Securities.fromObj(data.securities),
      data.updating,
      data.lastUpdate,
      data.snapshotDate,
      data.smallcaseAuthId,
      data.broker,
      MutualFunds.fromObj(data.mutualFunds),
    );
  }
}

class Smallcases {
  public: Array<PublicSmallcase> | null = null;
  private: Array<PublicSmallcase> | null = null;

  constructor(
    publicSmallcases: Array<PublicSmallcase>,
    privateSmallcases: Array<PublicSmallcase> | null,
  ) {
    this.public = publicSmallcases;
    this.private = privateSmallcases;
  }

  static fromObj(smallcases: Object) {
    if (smallcases === null || smallcases === undefined) {
      return null;
    }
    return new Smallcases(
      smallcases.public?.map(pu => PublicSmallcase.fromObj(pu)) ?? [],
      smallcases.public?.map(pr => PublicSmallcase.fromObj(pr)) ?? [],
    );
  }
}

class PublicSmallcase {
  scid: string;
  name: string;
  investmentDetailsURL: string;
  shortDescription: string | null;
  imageUrl: string | null;
  stats: Stats | null;
  constituents: Array<Constituent>;

  constructor(
    scid: string,
    name: string,
    investmentDetailsURL: string,
    shortDescription: string | null,
    imageUrl: string | null,
    stats: Stats | null,
    constituents: Array<Constituent>,
  ) {
    this.scid = scid;
    this.name = name;
    this.investmentDetailsURL = investmentDetailsURL;
    this.shortDescription = shortDescription;
    this.imageUrl = imageUrl;
    this.stats = stats;
    this.constituents = constituents;
  }

  static fromObj(smallcase: Object) {
    if (smallcase === null || smallcase === undefined) {
      return null;
    }
    return new PublicSmallcase(
      smallcase.scid,
      smallcase.name,
      smallcase.investmentDetailsURL,
      smallcase.shortDescription,
      smallcase.imageUrl,
      smallcase.stats === null ? null : Stats.fromObj(smallcase.stats),
      smallcase.constituents?.map(c => Constituent.fromObj(c)) ?? [],
    );
  }
}

class Constituent {
  ticker: string;
  shares: number;
  constructor(ticker: string, shares: number) {
    this.ticker = ticker;
    this.shares = shares;
  }

  static fromObj(constituent: Object) {
    if (constituent === null || constituent === undefined) {
      return null;
    }
    return new Constituent(
      constituent.ticker,
      constituent.shares,
    );
  }
}

class Stats {
  currentValue: number | null;
  totalReturns: number | null;
  constructor(currentValue: number | null, totalReturns: number | null) {
    this.currentValue = currentValue;
    this.totalReturns = totalReturns;
  }

  static fromObj(stats: Object) {
    if (stats === null || stats === undefined) {
      return null;
    }
    return new Stats(
      stats.currentValue,
      stats.totalReturns,
    );
  }
}

class Securities {
  holdings: Array<Holding>;
  constructor(holdings: Array<Holding>) {
    this.holdings = holdings;
  }

  static fromObj(securities: Object) {
    if (securities === null || securities === undefined) {
      return null;
    }
    return new Securities(securities.holdings?.map(h => Holding.fromObj(h)))
  }
}

class Holding implements SecuritiesI {
  name: string;
  exchange: string;
  ticker: string;
  averagePrice: number;
  shares: number;
  constructor(
    name: string,
    exchange: string,
    ticker: string,
    averagePrice: number,
    shares: number,
  ) {
    this.name = name;
    this.exchange = exchange;
    this.ticker = ticker;
    this.averagePrice = averagePrice;
    this.shares = shares;
  }

  static fromObj(holding: Object) {
    if (holding === null || holding === undefined) {
      return null;
    }
    return new Holding(
      holding.name,
      holding.exchange,
      holding.ticker,
      holding.averagePrice,
      holding.shares,
    );
  }
}

class MutualFunds {
  holdings: Array<MFHolding>;
  constructor(holdings: Array<MFHolding>) {
    this.holdings = holdings;
  }

  static fromObj(mutualFunds: Object) {
    if (mutualFunds === null || mutualFunds === undefined) {
      return null;
    }
    return new MutualFunds(
      mutualFunds?.holdings?.map(mf => MFHolding.fromObj(mf)) ?? [],
    );
  }
}

class MFHolding {
  folio: string | null;
  fund: string | null;
  pnl: number | null;
  quantity: number | null;
  isin: string | null;
  averagePrice: number | null;
  lastPriceDate: string | null;
  lastPrice: number | null;
  xirr: number | null;

  constructor(
    folio: string | null,
    fund: string | null,
    pnl: number | null,
    quantity: number | null,
    isin: string | null,
    averagePrice: number | null,
    lastPriceDate: string | null,
    lastPrice: number | null,
    xirr: number | null,
  ) {
    this.folio = folio;
    this.fund = fund;
    this.pnl = pnl;
    this.quantity = quantity;
    this.isin = isin;
    this.averagePrice = averagePrice;
    this.lastPriceDate = lastPriceDate;
    this.lastPrice = lastPrice;
    this.xirr = xirr;
  }

  static fromObj(holding: Object) {
    if (holding === null || holding === undefined) {
      return null;
    }
    return new MFHolding(
      holding.folio,
      holding.fund,
      holding.pnl,
      holding.quantity,
      holding.isin,
      holding.averagePrice,
      holding.lastPriceDate,
      holding.lastPrice,
      holding.xirr,
    );
  }
}

class HoldingsDataV2 {
  lastUpdate: string;
  securities: Array<SecurityV2>;
  smallcases: SmallcasesV2 | null;
  snapshotDate: string;
  updating: boolean;
  mutualFunds: MutualFunds | null;
  constructor(
    lastUpdate: string,
    securities: Array<SecurityV2>,
    smallcases: SmallcasesV2 | null,
    snapshotDate: string,
    updating: boolean,
    mutualFunds: MutualFunds | null,
  ) {
    this.lastUpdate = lastUpdate;
    this.securities = securities;
    this.smallcases = smallcases;
    this.snapshotDate = snapshotDate;
    this.updating = updating;
    this.mutualFunds = mutualFunds;
  }

  static assign(obj) {
    Object.assign(this, obj);
  }
}

class SecurityV2 {
  holdings: Holding;
  positions: Positions;
  transactableQuantity: number;
  smallcaseQuantity: number;
  nseTicker: string;
  bseTicker: string;
  isin: string;
  name: string;

  constructor(
    holdings: Holding,
    positions: Positions,
    transactableQuantity: number,
    smallcaseQuantity: number,
    nseTicker: string,
    bseTicker: string,
    isin: string,
    name: string,
  ) {
    this.holdings = holdings;
    this.positions = positions;
    this.transactableQuantity = transactableQuantity;
    this.smallcaseQuantity = smallcaseQuantity;
    this.nseTicker = nseTicker;
    this.bseTicker = bseTicker;
    this.isin = isin;
    this.name = name;
  }
}

class Positions {
  nse: Holding;
  bse: Holding;
  constructor(nse: Holding, bse: Holding) {
    this.nse = nse;
    this.bse = bse;
  }
}

class SmallcasesV2 {
  privateV2: PrivateV2;
  public: Array<PublicSmallcase>;
  constructor(privateV2: PrivateV2, publicSmallcases: Array<PublicSmallcase>) {
    this.privateV2 = privateV2;
    this.public = publicSmallcases;
  }
}

class PrivateV2 {
  investments: Array<PublicSmallcase>;
  constructor(investments: Array<PublicSmallcase>) {
    this.investments = investments;
  }
}

interface SecuritiesI {
  ticker: string;
  averagePrice: number;
  shares: number;
}

export {
  HoldingsData,
  Holding,
  HoldingsDataV2,
  SecurityV2,
  Positions,
  SmallcasesV2,
  PrivateV2,
  PublicSmallcase,
  Stats,
  MutualFunds,
  MFHolding,
};
