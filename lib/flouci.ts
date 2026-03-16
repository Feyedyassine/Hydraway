const FLOUCI_API = "https://developers.flouci.com/api/v2";

function getAuthHeader() {
  const pub = process.env.FLOUCI_PUBLIC_KEY!;
  const priv = process.env.FLOUCI_PRIVATE_KEY!;
  return `Bearer ${pub}:${priv}`;
}

interface GeneratePaymentParams {
  amount: number; // in TND (e.g. 29.9)
  orderId: number;
  successUrl: string;
  failUrl: string;
  webhookUrl: string;
}

interface GeneratePaymentResponse {
  result: {
    success: boolean;
    payment_id: string;
    link: string;
    developer_tracking_id: string;
  };
}

export async function generatePayment(params: GeneratePaymentParams) {
  const amountMillimes = Math.round(params.amount * 1000).toString();

  const res = await fetch(`${FLOUCI_API}/generate_payment`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountMillimes,
      developer_tracking_id: params.orderId.toString(),
      success_link: params.successUrl,
      fail_link: params.failUrl,
      webhook: params.webhookUrl,
      session_timeout_secs: 1200,
      accept_card: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Flouci generate_payment failed: ${text}`);
  }

  const data: GeneratePaymentResponse = await res.json();
  if (!data.result?.success) {
    throw new Error("Flouci payment generation unsuccessful");
  }

  return data.result;
}

interface VerifyPaymentResponse {
  result: {
    status: "SUCCESS" | "PENDING" | "EXPIRED" | "FAILURE";
    amount: string;
    developer_tracking_id: string;
  };
  success: boolean;
}

export async function verifyPayment(paymentId: string) {
  const res = await fetch(`${FLOUCI_API}/verify_payment/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: getAuthHeader(),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Flouci verify_payment failed: ${text}`);
  }

  const data: VerifyPaymentResponse = await res.json();
  return data;
}
