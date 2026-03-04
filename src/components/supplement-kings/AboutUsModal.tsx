import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Crown, CheckCircle2 } from "lucide-react";

interface AboutUsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutUsModal({ open, onOpenChange }: AboutUsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-white border-gray-200">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-2xl text-gray-900">About Supplement Kings</DialogTitle>
          </div>
          <DialogDescription className="text-gray-500">
            Learn about who we are and what we do
          </DialogDescription>
        </DialogHeader>

        {/* Video Placeholder */}
        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-6">
          <div className="text-center">
            <Crown className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-500">Company Introduction Video</p>
            <p className="text-sm text-gray-400">Coming Soon</p>
          </div>
        </div>

        {/* Company Story */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Our Story</h3>
          <p className="text-gray-600">
            Supplement Kings was founded by industry veterans who saw contractors consistently leaving money on the table 
            when dealing with insurance claims. With decades of combined experience in the roofing, restoration, and 
            insurance industries, we built a company dedicated to helping contractors maximize their claim settlements.
          </p>
          <p className="text-gray-600">
            Today, we've helped hundreds of contractors across Florida recover millions in underpaid claims. Our team 
            of certified Xactimate estimators, field inspectors, and negotiation specialists work together to ensure 
            you get every dollar you deserve.
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-6">What Sets Us Apart</h3>
          <ul className="space-y-3">
            {[
              "24-48 hour turnaround on all estimates",
              "Certified Xactimate Level 3 estimators",
              "Detailed line-item documentation with photos",
              "Direct negotiation with insurance adjusters",
              "Expert witness and deposition support",
              "Serving all 67 Florida counties"
            ].map((item, index) => (
              <li key={index} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span className="text-gray-600">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
