import { useEffect, useState } from "react";
import { Activity, Copy, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import type { Job, JobState } from "@/types/api";

interface JobStatusProps {
  jobId: string;
  shouldPoll?: boolean;
}

const stateConfig: Record<
  JobState,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }
> = {
  UPLOADED: {
    label: "Uploaded",
    variant: "secondary",
    icon: Loader2,
  },
  ORDER_CREATED: {
    label: "Order Created",
    variant: "default",
    icon: Loader2,
  },
  PAID: {
    label: "Paid",
    variant: "default",
    icon: CheckCircle2,
  },
  PRINTING: {
    label: "Printing",
    variant: "default",
    icon: Activity,
  },
  PRINT_ERROR: {
    label: "Print Error",
    variant: "destructive",
    icon: XCircle,
  },
  PAYMENT_FAILED: {
    label: "Payment Failed",
    variant: "destructive",
    icon: XCircle,
  },
};

export function JobStatus({ jobId, shouldPoll = false }: JobStatusProps) {
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchJobStatus = async () => {
    try {
      const response = await api.getJobStatus(jobId);
      setJob(response.job);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch status");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobStatus();

    if (shouldPoll) {
      const interval = setInterval(() => {
        fetchJobStatus();
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [jobId, shouldPoll]);

  const handleCopyJobId = () => {
    navigator.clipboard.writeText(jobId);
    toast({
      title: "Copied",
      description: "Job ID copied to clipboard",
    });
  };

  if (isLoading && !job) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Job Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Job Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={fetchJobStatus} variant="outline" size="sm" className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!job) return null;

  const config = stateConfig[job.state];
  const StatusIcon = config.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Job Status
        </CardTitle>
        <CardDescription>Track your print job progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
          <div className="space-y-1">
            <p className="text-sm font-medium">Current Status</p>
            <Badge variant={config.variant} className="mt-1">
              <StatusIcon
                className={`mr-1 h-3 w-3 ${
                  job.state === "UPLOADED" || job.state === "ORDER_CREATED"
                    ? "animate-spin"
                    : ""
                }`}
              />
              {config.label}
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Job ID:</span>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-secondary px-2 py-1 rounded">
                {jobId.slice(0, 8)}...
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyJobId}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Filename:</span>
            <span className="font-medium truncate max-w-[200px]">{job.filename}</span>
          </div>

          {job.order_id && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order ID:</span>
              <code className="text-xs bg-secondary px-2 py-1 rounded">
                {job.order_id.slice(0, 12)}...
              </code>
            </div>
          )}

          {job.payment_id && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment ID:</span>
              <code className="text-xs bg-secondary px-2 py-1 rounded">
                {job.payment_id.slice(0, 12)}...
              </code>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Created:</span>
            <span className="text-xs">
              {new Date(job.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        {(job.state === "PRINTING" || job.state === "PAID") && (
          <div className="bg-success/10 border border-success/20 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-success">Success!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your document is being processed and will be printed shortly.
              </p>
            </div>
          </div>
        )}

        {(job.state === "PRINT_ERROR" || job.state === "PAYMENT_FAILED") && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
            <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">Error</p>
              <p className="text-xs text-muted-foreground mt-1">
                {job.state === "PRINT_ERROR"
                  ? "There was an error printing your document. Please contact support."
                  : "Payment verification failed. Please try again or contact support."}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
