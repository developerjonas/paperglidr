// TEST CODE ONLY. Never imported by app code (enforced by
// src/test/noTestImports.test.ts): the only way to reach verifyAndFulfil
// with a stub is to pass FulfilDeps explicitly, which no app caller does.
import type { FulfilDeps } from "@/features/purchases/lib/verifyAndFulfil"
import type {
  GatewayPaymentStatus,
  PaymentVerifier,
  VerifyPaymentInput,
  VerifyPaymentResult,
} from "@/services/payments/types"

export type StubAnswer = {
  status: GatewayPaymentStatus
  amountInPaisa?: number | null
  gatewayTransactionId?: string | null
}

/**
 * A scripted gateway: answers per purchase id. Unknown purchases get
 * "pending" so a reconcile run never disturbs other tests' data.
 * `delayMs` holds each answer back to force overlapping calls.
 */
export class StubGateway implements PaymentVerifier {
  private answers = new Map<string, StubAnswer>()
  calls: VerifyPaymentInput[] = []

  constructor(private delayMs = 0) {}

  answer(purchaseId: string, answer: StubAnswer) {
    this.answers.set(purchaseId, answer)
    return this
  }

  async verify(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    this.calls.push(input)
    if (this.delayMs > 0) await new Promise(r => setTimeout(r, this.delayMs))
    const answer = this.answers.get(input.purchaseId) ?? { status: "pending" as const }
    return {
      status: answer.status,
      amountInPaisa: answer.amountInPaisa ?? null,
      gatewayTransactionId: answer.gatewayTransactionId ?? null,
      gatewayStatus: `stub:${answer.status}`,
      raw: { stub: true, ...answer },
    }
  }

  callsFor(purchaseId: string) {
    return this.calls.filter(call => call.purchaseId === purchaseId).length
  }
}

export function stubDeps(gateway: StubGateway, sentInvoices: string[] = []): FulfilDeps {
  return {
    getVerifier: () => gateway,
    sendInvoice: async invoiceId => {
      sentInvoices.push(invoiceId)
    },
  }
}
