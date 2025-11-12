import { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";
import { PayButton } from "@/components/PayButton";
import { JobStatus } from "@/components/JobStatus";
import { Toaster } from "@/components/ui/toaster";
import type { UploadResponse } from "@/types/api";

const AppContent = () => {
  const [uploadData, setUploadData] = useState<UploadResponse | null>(null);
  const [hasPaymentStarted, setHasPaymentStarted] = useState(false);
  const [shouldPollStatus, setShouldPollStatus] = useState(false);

  // Load saved job ID from localStorage on mount
  useEffect(() => {
    const savedJobId = localStorage.getItem("lastJobId");
    if (savedJobId) {
      // Restore basic data to show status panel
      setUploadData({
        job_id: savedJobId,
        filename: localStorage.getItem("lastFilename") || "Unknown",
        amount_paise: parseInt(localStorage.getItem("lastAmount") || "0"),
        status: "restored",
      });
      setHasPaymentStarted(true);
      setShouldPollStatus(true);
    }
  }, []);

  const handleUploadSuccess = (data: UploadResponse) => {
    setUploadData(data);
    setHasPaymentStarted(false);
    setShouldPollStatus(false);
    
    // Save to localStorage
    localStorage.setItem("lastJobId", data.job_id);
    localStorage.setItem("lastFilename", data.filename);
    localStorage.setItem("lastAmount", data.amount_paise.toString());
  };

  const handlePaymentSuccess = () => {
    setHasPaymentStarted(true);
    setShouldPollStatus(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Printer className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AutoPrint</h1>
              <p className="text-sm text-muted-foreground">
                Fast & Reliable Printing Service
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Step 1: Upload */}
          {!uploadData && (
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          )}

          {/* Step 2: Payment */}
          {uploadData && !hasPaymentStarted && (
            <PayButton
              jobId={uploadData.job_id}
              filename={uploadData.filename}
              amountPaise={uploadData.amount_paise}
              onPaymentSuccess={handlePaymentSuccess}
            />
          )}

          {/* Step 3: Job Status */}
          {uploadData && hasPaymentStarted && (
            <JobStatus jobId={uploadData.job_id} shouldPoll={shouldPollStatus} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              All transactions are secure and encrypted. Printing typically completes within 2-5
              minutes.
            </p>
            <p className="text-xs text-muted-foreground">
              Questions? Contact support at{" "}
              <a
                href="mailto:support@autoprint.example"
                className="text-primary hover:underline"
              >
                support@autoprint.example
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const App = () => (
  <>
    <AppContent />
    <Toaster />
  </>
);

export default App;
