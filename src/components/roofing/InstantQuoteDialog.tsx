import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Home, Calculator } from "lucide-react";

interface InstantQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageName: string;
  pricePerSquare: string;
  totalSquares: number;
  estimatedPrice: string;
  onRequestQuote: () => void;
}

export function InstantQuoteDialog({
  open,
  onOpenChange,
  packageName,
  pricePerSquare,
  totalSquares,
  estimatedPrice,
  onRequestQuote
}: InstantQuoteDialogProps) {
  const isContactPricing = estimatedPrice === "Contact for Pricing";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Home className="h-5 w-5 text-primary" />
            {packageName}
          </DialogTitle>
          <DialogDescription>
            Your instant ballpark estimate based on measured roof size
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Roof Size */}
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Your Roof Size</span>
            <span className="font-semibold">{totalSquares.toFixed(2)} squares</span>
          </div>

          {/* Price Per Square */}
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Price Per Square</span>
            <span className="font-semibold">
              {pricePerSquare === "TBD" ? "Contact for Quote" : `${pricePerSquare}/sq`}
            </span>
          </div>

          {/* Ballpark Estimate */}
          <div className="border-2 border-primary rounded-lg p-4 bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Ballpark Estimate
              </span>
            </div>
            <div className="text-3xl font-bold text-primary">
              {estimatedPrice}
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center">
            *Final price may vary based on inspection and site conditions
          </p>
        </div>

        <div className="flex gap-3">
          <Button onClick={onRequestQuote} className="flex-1">
            Request Official Quote
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
