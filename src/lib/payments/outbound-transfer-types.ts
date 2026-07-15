export type OutboundTransferUser = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  country: string | null;
  role: string;
  kycStatus: string;
  businessName?: string | null;
  registrationNumber?: string | null;
};

export type OutboundTransferBeneficiarySummary = {
  deliveryChannel: string;
  firstName: string;
  lastName: string;
  country: string | null;
};

export type OutboundTransferBeneficiary = OutboundTransferBeneficiarySummary & {
  id: string;
  bankName: string | null;
  flexBankName: string | null;
  flexBankCode: string | null;
  branchName: string | null;
  accountNumber: string | null;
  swiftBic: string | null;
  iban: string | null;
  sortCode: string | null;
  routingNumber: string | null;
  transitNumber: string | null;
  bsb: string | null;
  ifsc: string | null;
  payoutCurrency: string | null;
  mobileMoneyProvider: string | null;
  mobileNumber: string | null;
  payoutInPersonIdNumber: string | null;
};

export type OutboundTransferFile = {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string | null;
  docType?: string;
};

export type OutboundTransferListRow = {
  id: string;
  referenceCode: string;
  status: string;
  currentStep: number;
  senderCountryIso2: string | null;
  payCurrency: string | null;
  payAmount: number | null;
  recipientCountryLabel: string | null;
  recipientCountryIso2: string | null;
  receiveCurrency: string | null;
  receiveAmount: number | null;
  fxRateSnapshot: number | null;
  feeAmount: number | null;
  payInMethod: string | null;
  payerPhone: string | null;
  flexStkReference: string | null;
  flexStkStatus: string | null;
  flexPayoutReference: string | null;
  flexPayoutStatus: string | null;
  paymentConfirmedAt: string | null;
  payoutInitiatedAt: string | null;
  completedAt: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  user: OutboundTransferUser;
  beneficiary: OutboundTransferBeneficiarySummary | null;
};

export type OutboundTransferDetail = OutboundTransferListRow & {
  quoteExpiresAt: string | null;
  sourceOfIncome: string | null;
  transferPurpose: string | null;
  relationshipToRecipient: string | null;
  complianceAccepted: boolean;
  beneficiary: OutboundTransferBeneficiary | null;
  paymentProofs: OutboundTransferFile[];
  supportingDocuments: OutboundTransferFile[];
};

export type CorporateCustomerOption = {
  id: string;
  name: string | null;
  email: string | null;
  country: string | null;
};
