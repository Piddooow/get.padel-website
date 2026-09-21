/**
 * Payment webhook handler (PRD Fase 2).
 *
 * AYO (or a payment provider acting for the venue) can notify us when a
 * booking payment succeeds or fails. PRD compliance:
 * - no payment data/credentials/amounts are stored (PRD §6);
 * - the callback only advances the LOCAL slot-hold lifecycle:
 *     paid   → hold becomes `completed`
 *     failed → hold is released, freeing the slot locally
 * - order records are never marked as paid — AYO owns payment state.
 */
import {
  completeSlotHold,
  releaseSlotHold,
  SlotHoldError,
} from "@/lib/slot-holds";
import { getGuestOrder, GuestOrderError } from "@/lib/guest-orders";

export const PAYMENT_EVENT_STATUSES = ["paid", "failed"] as const;
export type PaymentEventStatus = (typeof PAYMENT_EVENT_STATUSES)[number];

export type AppliedAction = "hold_completed" | "hold_released" | "noop";

export interface PaymentEventResult {
  reference: string;
  status: PaymentEventStatus;
  applied: AppliedAction;
  holdStatus: string | null;
}

export class PaymentWebhookError extends Error {
  constructor(
    public code: "INVALID_INPUT" | "NOT_FOUND",
    message: string
  ) {
    super(message);
  }
}

export function isPaymentEventStatus(
  value: unknown
): value is PaymentEventStatus {
  return (
    typeof value === "string" &&
    (PAYMENT_EVENT_STATUSES as readonly string[]).includes(value)
  );
}

/** Applies a paid/failed event to the guest order + its slot hold. */
export async function applyPaymentEvent(
  reference: string,
  status: PaymentEventStatus,
  now: Date = new Date()
): Promise<PaymentEventResult> {
  const order = await getGuestOrder(reference);
  if (!order) {
    throw new PaymentWebhookError(
      "NOT_FOUND",
      `Unknown order "${reference}".`
    );
  }

  const holdActive =
    order.hold?.status === "active" &&
    new Date(order.hold.expiresAt).getTime() > now.getTime();

  if (!holdActive) {
    return {
      reference,
      status,
      applied: "noop",
      holdStatus: order.hold?.status ?? null,
    };
  }

  try {
    const hold =
      status === "paid"
        ? await completeSlotHold(reference, now)
        : await releaseSlotHold(reference, now);
    return {
      reference,
      status,
      applied: status === "paid" ? "hold_completed" : "hold_released",
      holdStatus: hold.status,
    };
  } catch (error) {
    if (error instanceof SlotHoldError && error.code === "NOT_FOUND") {
      throw new PaymentWebhookError("NOT_FOUND", error.message);
    }
    if (error instanceof GuestOrderError) {
      throw error;
    }
    throw error;
  }
}
