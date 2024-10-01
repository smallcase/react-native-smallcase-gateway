type OrderConfig = {
  type: string;
  securities: Security[];
};

type Security = {
  ticker: string;
  quantity: number | undefined;
  type: string | null | undefined;
};

export type {OrderConfig, Security};
