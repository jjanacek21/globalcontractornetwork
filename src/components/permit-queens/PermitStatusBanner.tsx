import { AlertCircle, CheckCircle2, Clock, CreditCard, FileText, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PermitStatusBannerProps {
  pipelineStatus: string;
  cityReviewStatus?: string;
  paymentStatus?: string;
  readyForPaymentNotifiedAt?: string | null;
  onPayNow?: () => void;
  className?: string;
}

const STATUS_CONFIG: Record<string, {
  icon: React.ReactNode;
  title: string;
  description: string;
  bgClass: string;
  textClass: string;
  showPayButton?: boolean;
}> = {
  'intake': {
    icon: <FileText className="h-5 w-5" />,
    title: 'Application Received',
    description: 'Your permit application has been received and is being processed.',
    bgClass: 'bg-blue-50 border-blue-200',
    textClass: 'text-blue-800',
  },
  'gathering_info': {
    icon: <Clock className="h-5 w-5" />,
    title: 'Gathering Information',
    description: 'We are reviewing your application and may need additional documents.',
    bgClass: 'bg-amber-50 border-amber-200',
    textClass: 'text-amber-800',
  },
  'documents_submitted': {
    icon: <FileText className="h-5 w-5" />,
    title: 'Documents Under Review',
    description: 'Your documents have been submitted and are being verified.',
    bgClass: 'bg-purple-50 border-purple-200',
    textClass: 'text-purple-800',
  },
  'under_review': {
    icon: <Clock className="h-5 w-5" />,
    title: 'Under Review',
    description: 'Your permit packet is being reviewed by our team.',
    bgClass: 'bg-indigo-50 border-indigo-200',
    textClass: 'text-indigo-800',
  },
  'pending_city_review': {
    icon: <Clock className="h-5 w-5" />,
    title: 'Submitted to City',
    description: 'Your permit has been submitted to the building department for review.',
    bgClass: 'bg-cyan-50 border-cyan-200',
    textClass: 'text-cyan-800',
  },
  'ready_for_payment': {
    icon: <CreditCard className="h-5 w-5" />,
    title: '🎉 Ready for Payment!',
    description: 'Your permit has been approved. Complete payment to receive your permit.',
    bgClass: 'bg-green-50 border-green-200',
    textClass: 'text-green-800',
    showPayButton: true,
  },
  'approved': {
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: 'Permit Approved',
    description: 'Congratulations! Your permit has been approved.',
    bgClass: 'bg-green-50 border-green-200',
    textClass: 'text-green-800',
  },
  'issued': {
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: 'Permit Issued',
    description: 'Your permit has been issued. You can now begin work.',
    bgClass: 'bg-emerald-50 border-emerald-200',
    textClass: 'text-emerald-800',
  },
  'rejected': {
    icon: <AlertCircle className="h-5 w-5" />,
    title: 'Application Needs Attention',
    description: 'There are issues with your application that need to be addressed.',
    bgClass: 'bg-red-50 border-red-200',
    textClass: 'text-red-800',
  },
};

export function PermitStatusBanner({
  pipelineStatus,
  cityReviewStatus,
  paymentStatus,
  readyForPaymentNotifiedAt,
  onPayNow,
  className,
}: PermitStatusBannerProps) {
  const config = STATUS_CONFIG[pipelineStatus] || STATUS_CONFIG['intake'];
  
  // If payment is complete, show different message
  if (paymentStatus === 'paid' && pipelineStatus === 'ready_for_payment') {
    return (
      <div className={cn(
        "border rounded-lg p-4",
        "bg-green-50 border-green-200",
        className
      )}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-800">Payment Complete</h3>
            <p className="text-sm text-green-700">
              Your payment has been received. Your permit will be issued shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "border rounded-lg p-4",
      config.bgClass,
      className
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("flex-shrink-0 mt-0.5", config.textClass)}>
          {config.icon}
        </div>
        <div className="flex-1">
          <h3 className={cn("font-semibold", config.textClass)}>
            {config.title}
          </h3>
          <p className={cn("text-sm mt-0.5", config.textClass.replace('800', '700'))}>
            {config.description}
          </p>
          
          {/* Show notification badge if recently notified */}
          {readyForPaymentNotifiedAt && pipelineStatus === 'ready_for_payment' && (
            <div className="flex items-center gap-1 mt-2">
              <Bell className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">
                Notified on {new Date(readyForPaymentNotifiedAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
        
        {/* Payment Button */}
        {config.showPayButton && onPayNow && paymentStatus !== 'paid' && (
          <Button 
            onClick={onPayNow}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Pay Now
          </Button>
        )}
      </div>
    </div>
  );
}
