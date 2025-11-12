export interface UploadResponse {
  status: string;
  job_id: string;
  filename: string;
  amount_paise: number;
}

export interface CreateOrderResponse {
  status: string;
  order_id: string;
  amount: number;
  currency: string;
  razorpay_key_id: string;
}

export interface VerifyPaymentResponse {
  status: string;
  message: string;
}

export interface Job {
  id: string;
  filename: string;
  state: JobState;
  order_id?: string;
  payment_id?: string;
  created_at: string;
}

export interface JobStatusResponse {
  status: string;
  job: Job;
}

export type JobState =
  | "UPLOADED"
  | "ORDER_CREATED"
  | "PAID"
  | "PRINTING"
  | "PRINT_ERROR"
  | "PAYMENT_FAILED";

export interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  handler: (response: RazorpayResponse) => void;
  modal: {
    ondismiss: () => void;
  };
  theme: {
    color: string;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, handler: (response: any) => void) => void;
    };
  }
}
