import crypto from "crypto";

// =============================================
// PayU Configuration
// =============================================

const PAYU_CONFIG = {
  apiKey: process.env.PAYU_API_KEY || "",
  apiLogin: process.env.PAYU_API_LOGIN || "",
  merchantId: process.env.PAYU_MERCHANT_ID || "",
  accountId: process.env.PAYU_ACCOUNT_ID || "",
  isTest: process.env.PAYU_TEST_MODE === "true",
  paymentsUrl:
    process.env.PAYU_TEST_MODE === "true"
      ? "https://sandbox.api.payulatam.com/payments-api/4.0/service.cgi"
      : "https://api.payulatam.com/payments-api/4.0/service.cgi",
  reportsUrl:
    process.env.PAYU_TEST_MODE === "true"
      ? "https://sandbox.api.payulatam.com/reports-api/4.0/service.cgi"
      : "https://api.payulatam.com/reports-api/4.0/service.cgi",
  currency: "COP",
  country: "CO",
};

// =============================================
// Signature Generation
// =============================================

export function generatePayUSignature(
  referenceCode: string,
  amount: number,
  currency: string = PAYU_CONFIG.currency
): string {
  const raw = `${PAYU_CONFIG.apiKey}~${PAYU_CONFIG.merchantId}~${referenceCode}~${amount}~${currency}`;
  return crypto.createHash("md5").update(raw).digest("hex");
}

export function verifyPayUSignature(
  referenceCode: string,
  amount: number,
  currency: string,
  incomingSignature: string
): boolean {
  // PayU sends amount with 1 decimal (.0) in confirmation
  const sig1 = generatePayUSignature(referenceCode, amount, currency);
  const roundedAmount = Math.round(amount * 10) / 10;
  const rawRounded = `${PAYU_CONFIG.apiKey}~${PAYU_CONFIG.merchantId}~${referenceCode}~${roundedAmount}~${currency}`;
  const sig2 = crypto.createHash("md5").update(rawRounded).digest("hex");
  return (
    incomingSignature === sig1 || incomingSignature === sig2
  );
}

// =============================================
// API Request Helper
// =============================================

async function payuRequest(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayU API error (${res.status}): ${text}`);
  }

  return res.json();
}

// =============================================
// PSE Banks List
// =============================================

export async function getPSEBanksList(): Promise<
  { pseCode: string; description: string }[]
> {
  const body = {
    language: "es",
    command: "GET_BANKS_LIST",
    merchant: {
      apiKey: PAYU_CONFIG.apiKey,
      apiLogin: PAYU_CONFIG.apiLogin,
    },
    test: PAYU_CONFIG.isTest,
    bankListInformation: {
      paymentMethod: "PSE",
      paymentCountry: PAYU_CONFIG.country,
    },
  };

  const response = await payuRequest(PAYU_CONFIG.paymentsUrl, body);

  if (response.code !== "SUCCESS") {
    throw new Error(`PayU banks list error: ${response.error || "Unknown"}`);
  }

  return (response.banks || []).map(
    (b: { pseCode: string; description: string }) => ({
      pseCode: b.pseCode,
      description: b.description,
    })
  );
}

// =============================================
// PSE Payment
// =============================================

export interface PSEPaymentParams {
  referenceCode: string;
  description: string;
  amount: number;
  tax: number;
  taxReturnBase: number;
  buyerEmail: string;
  buyerFullName: string;
  buyerDocument: string;
  buyerDocumentType: string; // CC, CE, NIT, etc.
  buyerPhone: string;
  pseBank: string;
  personType: "N" | "J"; // Natural o Juridica
  responseUrl: string;
  ipAddress: string;
  userAgent: string;
  cookie: string;
}

export async function createPSEPayment(params: PSEPaymentParams) {
  const signature = generatePayUSignature(
    params.referenceCode,
    params.amount
  );

  const body = {
    language: "es",
    command: "SUBMIT_TRANSACTION",
    merchant: {
      apiKey: PAYU_CONFIG.apiKey,
      apiLogin: PAYU_CONFIG.apiLogin,
    },
    transaction: {
      order: {
        accountId: PAYU_CONFIG.accountId,
        referenceCode: params.referenceCode,
        description: params.description,
        language: "es",
        signature,
        additionalValues: {
          TX_VALUE: {
            value: params.amount,
            currency: PAYU_CONFIG.currency,
          },
          TX_TAX: {
            value: params.tax,
            currency: PAYU_CONFIG.currency,
          },
          TX_TAX_RETURN_BASE: {
            value: params.taxReturnBase,
            currency: PAYU_CONFIG.currency,
          },
        },
        buyer: {
          merchantBuyerId: params.buyerDocument,
          fullName: params.buyerFullName,
          emailAddress: params.buyerEmail,
          contactPhone: params.buyerPhone,
          dniNumber: params.buyerDocument,
          dniType: params.buyerDocumentType,
        },
      },
      payer: {
        merchantPayerId: params.buyerDocument,
        fullName: params.buyerFullName,
        emailAddress: params.buyerEmail,
        contactPhone: params.buyerPhone,
        dniNumber: params.buyerDocument,
        dniType: params.buyerDocumentType,
      },
      extraParameters: {
        RESPONSE_URL: params.responseUrl,
        PSE_REFERENCE1: `IP:${params.ipAddress}`,
        FINANCIAL_INSTITUTION_CODE: params.pseBank,
        USER_TYPE: params.personType,
        PSE_REFERENCE2: params.buyerDocumentType,
        PSE_REFERENCE3: params.buyerDocument,
      },
      type: "AUTHORIZATION_AND_CAPTURE",
      paymentMethod: "PSE",
      paymentCountry: PAYU_CONFIG.country,
      deviceSessionId: params.cookie,
      ipAddress: params.ipAddress,
      cookie: params.cookie,
      userAgent: params.userAgent,
    },
    test: PAYU_CONFIG.isTest,
  };

  const response = await payuRequest(PAYU_CONFIG.paymentsUrl, body);

  if (response.code !== "SUCCESS") {
    throw new Error(
      `PayU PSE error: ${response.error || JSON.stringify(response)}`
    );
  }

  const tx = response.transactionResponse;
  return {
    transactionId: tx?.transactionId as string | null,
    orderId: tx?.orderId as string | null,
    state: tx?.state as string,
    responseCode: tx?.responseCode as string,
    bankUrl: tx?.extraParameters?.BANK_URL as string | null,
    pendingReason: tx?.pendingReason as string | null,
  };
}

// =============================================
// Credit Card Payment
// =============================================

export interface CreditCardPaymentParams {
  referenceCode: string;
  description: string;
  amount: number;
  tax: number;
  taxReturnBase: number;
  buyerEmail: string;
  buyerFullName: string;
  buyerDocument: string;
  buyerDocumentType: string;
  buyerPhone: string;
  cardNumber: string;
  cardExpiration: string; // YYYY/MM
  cardSecurityCode: string;
  cardHolderName: string;
  installments: number;
  paymentMethod: string; // VISA, MASTERCARD, etc.
  ipAddress: string;
  userAgent: string;
  cookie: string;
}

export async function createCreditCardPayment(
  params: CreditCardPaymentParams
) {
  const signature = generatePayUSignature(
    params.referenceCode,
    params.amount
  );

  const body = {
    language: "es",
    command: "SUBMIT_TRANSACTION",
    merchant: {
      apiKey: PAYU_CONFIG.apiKey,
      apiLogin: PAYU_CONFIG.apiLogin,
    },
    transaction: {
      order: {
        accountId: PAYU_CONFIG.accountId,
        referenceCode: params.referenceCode,
        description: params.description,
        language: "es",
        signature,
        additionalValues: {
          TX_VALUE: {
            value: params.amount,
            currency: PAYU_CONFIG.currency,
          },
          TX_TAX: {
            value: params.tax,
            currency: PAYU_CONFIG.currency,
          },
          TX_TAX_RETURN_BASE: {
            value: params.taxReturnBase,
            currency: PAYU_CONFIG.currency,
          },
        },
        buyer: {
          merchantBuyerId: params.buyerDocument,
          fullName: params.buyerFullName,
          emailAddress: params.buyerEmail,
          contactPhone: params.buyerPhone,
          dniNumber: params.buyerDocument,
          dniType: params.buyerDocumentType,
        },
      },
      payer: {
        merchantPayerId: params.buyerDocument,
        fullName: params.buyerFullName,
        emailAddress: params.buyerEmail,
        contactPhone: params.buyerPhone,
        dniNumber: params.buyerDocument,
        dniType: params.buyerDocumentType,
      },
      creditCard: {
        number: params.cardNumber,
        securityCode: params.cardSecurityCode,
        expirationDate: params.cardExpiration,
        name: params.cardHolderName,
      },
      type: "AUTHORIZATION_AND_CAPTURE",
      paymentMethod: params.paymentMethod,
      paymentCountry: PAYU_CONFIG.country,
      deviceSessionId: params.cookie,
      ipAddress: params.ipAddress,
      cookie: params.cookie,
      userAgent: params.userAgent,
      extraParameters: {
        INSTALLMENTS_NUMBER: params.installments,
      },
    },
    test: PAYU_CONFIG.isTest,
  };

  const response = await payuRequest(PAYU_CONFIG.paymentsUrl, body);

  if (response.code !== "SUCCESS") {
    throw new Error(
      `PayU CC error: ${response.error || JSON.stringify(response)}`
    );
  }

  const tx = response.transactionResponse;
  return {
    transactionId: tx?.transactionId as string | null,
    orderId: tx?.orderId as string | null,
    state: tx?.state as string,
    responseCode: tx?.responseCode as string,
    pendingReason: tx?.pendingReason as string | null,
  };
}

// =============================================
// Query Transaction Status
// =============================================

export async function queryTransactionByReference(referenceCode: string) {
  const body = {
    language: "es",
    command: "ORDER_DETAIL_BY_REFERENCE_CODE",
    merchant: {
      apiKey: PAYU_CONFIG.apiKey,
      apiLogin: PAYU_CONFIG.apiLogin,
    },
    details: {
      referenceCode,
    },
    test: PAYU_CONFIG.isTest,
  };

  const response = await payuRequest(PAYU_CONFIG.reportsUrl, body);

  if (response.code !== "SUCCESS") {
    return null;
  }

  const orders = response.result?.payload || [];
  if (orders.length === 0) return null;

  const latestOrder = orders[0];
  const transactions = latestOrder.transactions || [];
  const latestTx = transactions[transactions.length - 1];

  return {
    orderId: String(latestOrder.id),
    referenceCode: latestOrder.referenceCode as string,
    status: latestOrder.status as string,
    transactionState: latestTx?.transactionResponse?.state as string | undefined,
    responseCode: latestTx?.transactionResponse?.responseCode as string | undefined,
  };
}

// =============================================
// PayU Confirmation (Webhook) Response Parser
// =============================================

export interface PayUConfirmation {
  merchantId: string;
  referenceCode: string;
  transactionId: string;
  state: string; // 4=APPROVED, 6=DECLINED, 7=PENDING, 5=EXPIRED, 104=ERROR
  responseCode: string;
  polResponseCode: string;
  sign: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentMethodType: string;
}

export function parsePayUConfirmation(
  formData: Record<string, string>
): PayUConfirmation {
  return {
    merchantId: formData.merchant_id || "",
    referenceCode: formData.reference_sale || formData.referenceCode || "",
    transactionId: formData.transaction_id || formData.transactionId || "",
    state: formData.state_pol || formData.lapTransactionState || "",
    responseCode: formData.response_code_pol || formData.lapResponseCode || "",
    polResponseCode: formData.response_message_pol || "",
    sign: formData.sign || formData.signature || "",
    amount: parseFloat(formData.value || formData.TX_VALUE || "0"),
    currency: formData.currency || "COP",
    paymentMethod: formData.payment_method || "",
    paymentMethodType: formData.payment_method_type?.toString() || "",
  };
}

export function getPayUStateLabel(state: string): string {
  const states: Record<string, string> = {
    "4": "APPROVED",
    "6": "DECLINED",
    "7": "PENDING",
    "5": "EXPIRED",
    "104": "ERROR",
    APPROVED: "APPROVED",
    DECLINED: "DECLINED",
    PENDING: "PENDING",
    EXPIRED: "EXPIRED",
    ERROR: "ERROR",
  };
  return states[state] || "UNKNOWN";
}
