import { prisma } from "../lib/prisma";

const DEFAULT_GATEWAY_DOMAIN = "secure.nmi.com";

function isRealSecurityKey(key?: string | null): key is string {
  return Boolean(key && key.length > 10);
}

/** DB (Settings page) takes priority over the .env fallback, same pattern as stripeService. */
async function resolveSecurityKey(): Promise<string | null> {
  const location = await prisma.location.findFirst();
  if (isRealSecurityKey(location?.nmiSecurityKey)) return location!.nmiSecurityKey!;
  if (isRealSecurityKey(process.env.NMI_SECURITY_KEY)) return process.env.NMI_SECURITY_KEY!;
  return null;
}

/** NMI is white-label — sandbox accounts and many resellers serve both the
 *  charge API and Collect.js from their own domain, not secure.nmi.com. */
export async function resolveGatewayDomain(): Promise<string> {
  const location = await prisma.location.findFirst();
  return location?.nmiGatewayDomain || process.env.NMI_GATEWAY_DOMAIN || DEFAULT_GATEWAY_DOMAIN;
}

export async function isNmiConfigured(): Promise<boolean> {
  return (await resolveSecurityKey()) !== null;
}

export interface NmiChargeResult {
  approved: boolean;
  transactionId?: string;
  responseText: string;
}

/** Charges a Collect.js payment_token for `amountUsd`. Throws if NMI isn't
 *  configured; otherwise always resolves — a decline is a normal result
 *  (`approved: false`), not an error, same as how a Stripe card gets declined. */
export async function chargeNmiToken(amountUsd: number, paymentToken: string, orderId: string): Promise<NmiChargeResult> {
  const securityKey = await resolveSecurityKey();
  if (!securityKey) throw new Error("NMI is not configured");
  const domain = await resolveGatewayDomain();

  const body = new URLSearchParams({
    security_key: securityKey,
    type: "sale",
    amount: amountUsd.toFixed(2),
    payment_token: paymentToken,
    order_id: orderId,
  });

  // Without a timeout, a stalled connection to the gateway would leave the
  // guest's booking request hanging indefinitely with no error at all.
  const res = await fetch(`https://${domain}/api/transact.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal: AbortSignal.timeout(20000),
  });

  // NMI's classic API replies as form-encoded key=value pairs, not JSON.
  const text = await res.text();
  const parsed = new URLSearchParams(text);
  const response = parsed.get("response"); // "1" approved, "2" declined, "3" error

  return {
    approved: response === "1",
    transactionId: parsed.get("transactionid") ?? undefined,
    responseText: parsed.get("responsetext") ?? (response === "1" ? "Approved" : "Card was declined"),
  };
}
