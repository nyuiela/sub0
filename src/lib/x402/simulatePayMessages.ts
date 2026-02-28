/** Message types for postMessage between simulate payment popup and opener. */

export const SIMULATE_PAYMENT_MESSAGE_TYPE_SUCCESS = "simulate-payment-success";
export const SIMULATE_PAYMENT_MESSAGE_TYPE_ERROR = "simulate-payment-error";

export interface SimulatePaymentSuccessPayload {
  type: typeof SIMULATE_PAYMENT_MESSAGE_TYPE_SUCCESS;
  enqueued: number;
  jobIds: string[];
  durationMinutes: number;
}

export interface SimulatePaymentErrorPayload {
  type: typeof SIMULATE_PAYMENT_MESSAGE_TYPE_ERROR;
  error: string;
}

export type SimulatePaymentMessage = SimulatePaymentSuccessPayload | SimulatePaymentErrorPayload;

export function isSimulatePaymentSuccess(
  data: unknown
): data is SimulatePaymentSuccessPayload {
  const d = data as SimulatePaymentSuccessPayload;
  return (
    typeof data === "object" &&
    data !== null &&
    d.type === SIMULATE_PAYMENT_MESSAGE_TYPE_SUCCESS &&
    typeof d.enqueued === "number" &&
    typeof d.durationMinutes === "number"
  );
}

export function isSimulatePaymentError(
  data: unknown
): data is SimulatePaymentErrorPayload {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as SimulatePaymentErrorPayload).type === SIMULATE_PAYMENT_MESSAGE_TYPE_ERROR &&
    typeof (data as SimulatePaymentErrorPayload).error === "string"
  );
}
