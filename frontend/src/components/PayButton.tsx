import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import type { RazorpayResponse } from "@/types/api";

interface PayButtonProps {
  jobId: string;
  filename: string;
  amountPaise: number;
  onPaymentSuccess: () => void;
  disabled?: boolean;
}

export function PayButton({
  jobId,
  filename,
  amountPaise,
  onPaymentSuccess,
  disabled = false,
}: PayButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error("Failed to load Razorpay. Please check your connection.");
      }

      // Create order
      const orderData = await api.createOrder(jobId);

      // Open Razorpay checkout
      const options = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.order_id,
        name: "AutoPrint",
        description: `Print Job - ${filename}`,
        handler: async (response: RazorpayResponse) => {
          try {
            await api.verifyPayment(
              jobId,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            toast({
              title: "Payment successful",
              description: "Printing started! Check status below.",
            });
            onPaymentSuccess();
          } catch (error) {
            toast({
              title: "Payment verification failed",
              description: error instanceof Error ? error.message : "Please contact support",
              variant: "destructive",
            });
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast({
              title: "Payment cancelled",
              description: "You can retry payment anytime",
            });
            setIsProcessing(false);
          },
        },
        theme: {
          color: "#1E88E5",
        },
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on("payment.failed", (response: any) => {
        toast({
          title: "Payment failed",
          description: response.error?.description || "Please try again",
          variant: "destructive",
        });
        setIsProcessing(false);
      });

      razorpay.open();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initiate payment",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Pay & Print
        </CardTitle>
        <CardDescription>
          Complete payment to start printing your document
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-secondary p-4 rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Document:</span>
            <span className="text-sm font-medium truncate max-w-[200px]">{filename}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Amount:</span>
            <span className="text-lg font-bold text-primary">
              ₹{(amountPaise / 100).toFixed(2)}
            </span>
          </div>
        </div>

        <Button
          onClick={handlePayment}
          disabled={disabled || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay with Razorpay
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Secure payment powered by Razorpay
        </p>
      </CardContent>
    </Card>
  );
}
