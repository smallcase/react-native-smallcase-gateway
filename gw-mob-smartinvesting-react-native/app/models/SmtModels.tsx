type SmallcaseDto = {
  id: string;
  scid: string;
  newsTag: string;
  initialIndex: any;
  keywordsMatchCount: number;
  info: SmallcaseDtoInfo;
  stats: SmallcaseStatsDto;
};

type SmallcaseDtoInfo = {
  type: string;
  name: string;
  shortDescription: string;
  publisherName: string;
  blogURL: string;
  nextUpdate: string;
  rebalanceSchedule: string;
  lastRebalanced: string;
};

type SmallcaseStatsDto = {
  indexValue: number;
  unadjustedValue: number;
  divReturns: any;
  lastCloseIndex: number;
  minInvestAmount: any;
  ratios: RatiosDTO;
  smallcaseReturns: SmallcaseReturns;
};

type RatiosDTO = {
  jsonMember52wHigh: any;
  jsonMember52wLow: any;
  divYield: any;
  divYieldDifferential: any;
  largeCapPercentage: any;
  marketCapCategory: any;
  midCapPercentage: any;
  pb: any;
  pbDiscount: any;
  pe: any;
  peDiscount: any;
  smallCapPercentage: any;
  cagr: any;
  momentumRank: any;
  risk: any;
  sharpe: any;
  ema: any;
  momentum: any;
  lastCloseEma: any;
  sharpeRatio: any;
};

type SmallcaseReturns = {
  daily: any;
  weekly: any;
  monthly: any;
  yearly: any;
};

export type {SmallcaseDto};
