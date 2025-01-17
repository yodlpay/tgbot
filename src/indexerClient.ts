import { isHex } from "viem";

const INDEXER_API_URL = process.env.INDEXER_API_URL || "/api";

export type PaymentStats = {
  volumeInUSD: number;
  uniqueWallets: number;
  total: number;
};

export type PaymentsPaginationResponse = {
  page: number;
  perPage: number;
  total: number;
  payments: PaymentSimple[];
};

export type PaymentResponse = {
  payment: PaymentSimple;
};

export type PaymentSimple = {
  chainId: number;
  txHash: string;
  paymentIndex: number;
  blockTimestamp: string;

  tokenOutSymbol: string;
  tokenOutAddress: string;
  tokenOutAmountGross: string;
  receiverAddress: string;
  receiverEnsPrimaryName: string;
  senderAddress: string;
  senderEnsPrimaryName: string;
};

export class PaymentNotFoundError extends Error { }

export async function fetchPaymentByTxHash(
  txHash: string,
): Promise<PaymentResponse> {
  if (!isHex(txHash)) {
    throw new Error("Invalid txHash");
  }

  const url = `${INDEXER_API_URL}/v1/payments/${txHash}`;
  const options = { next: { revalidate: 7 * 24 * 3600 } };

  console.log("fetching", url);

  const resp = await fetch(url);

  console.log(resp);

  if (!resp.ok) {
    console.log("resp", resp);
    if (resp.status == 404) {
      console.log("Payment not found");
      throw new PaymentNotFoundError();
    }
    throw new Error("Failure");
  }

  const response = await resp.json();

  console.log("response", response);

  return response as PaymentResponse;
}
