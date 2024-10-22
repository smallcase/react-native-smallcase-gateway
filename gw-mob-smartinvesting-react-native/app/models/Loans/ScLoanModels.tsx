type ContactType = 'PHONE' | 'EMAIL';

type PhoneNumber = {
  number: string;
  countryCode: string | '+91';
};

type Contact = {
  type: ContactType;
  phone?: PhoneNumber | null;
  email?: string | null;
  isVerified?: boolean | null;
  isPrimary?: boolean | null;
};

type ContactsPayload = {
  contacts: Contact[];
};

type MFHolding = {
  repository: string | null;
  amcCode: string | null;
  folio: string | null;
  schemeCode: string | null;
  schemeName: string | null;
  isin: string | null;
  schemeType: string | null;
  units: number | null;
};

type MFHoldingPayload = {
  mfHoldings: MFHolding[];
};

type BankAccount = {
  accountNumber: string | null;
  ifscCode: string | null;
  accountType: string | null;
  primary: boolean | null;
};

type BankAccountPayload = {
  bankAccounts: BankAccount[];
};

type Loan = {
  lid: string;
};

type CreateUnityUserPayload = {
  id: string | null;
  pan: string | null;
  dob: string | null;
  contacts: Contact[] | null;
  mfHoldings: MFHolding[] | null;
  bankAccounts: BankAccount[] | null;
  lender: string | null;
  isLienMarkingMocked: boolean | null;
  loans: Loan[] | null;
};

type CreateUnityInteractionTokenPayload = {
  intent?: string;
  config?: {
    lid?: string;
    lender?: string;
    opaqueId?: string;
    userId?: string;
    amount?: string;
    type?: string;
    loans?: Loan[];
  };
};

// type UnityGuestUserInteractionTokenPayload = {
//   intent: string | null;
//   config: {
//     lender: string | null;
//     opaqueId: string | null;
//   };
// };

export type {
  Contact,
  PhoneNumber,
  ContactType,
  MFHolding,
  BankAccount,
  ContactsPayload,
  MFHoldingPayload,
  BankAccountPayload,
  CreateUnityUserPayload,
  CreateUnityInteractionTokenPayload,
  // UnityGuestUserInteractionTokenPayload,
};
