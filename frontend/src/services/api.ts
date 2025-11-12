import type {
  UploadResponse,
  CreateOrderResponse,
  VerifyPaymentResponse,
  JobStatusResponse,
} from "@/types/api";

const API_BASE = "";

export const api = {
  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Upload failed");
    }

    return response.json();
  },

  async createOrder(jobId: string): Promise<CreateOrderResponse> {
    const response = await fetch(`${API_BASE}/api/create_order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ job_id: jobId }),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Order creation failed");
    }

    return response.json();
  },

  async verifyPayment(
    jobId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<VerifyPaymentResponse> {
    const response = await fetch(`${API_BASE}/api/verify_payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        job_id: jobId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      }),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Payment verification failed");
    }

    return response.json();
  },

  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    const response = await fetch(`${API_BASE}/api/job/${jobId}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Failed to fetch job status");
    }

    return response.json();
  },
};
