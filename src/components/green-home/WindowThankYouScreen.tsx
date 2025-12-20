import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Calendar, Phone, Download } from "lucide-react";
import { Link } from "react-router-dom";

interface WindowThankYouScreenProps {
  name: string;
  discount: number;
  estimateLow: number;
  estimateHigh: number;
}

export const WindowThankYouScreen = ({ name, discount, estimateLow, estimateHigh }: WindowThankYouScreenProps) => {
  const discountedLow = Math.round(estimateLow * (1 - discount / 100));
  const discountedHigh = Math.round(estimateHigh * (1 - discount / 100));
  const savings = estimateHigh - discountedHigh;

  return (
    <section className="py-20 bg-gradient-to-b from-emerald-50 to-white">
      <div className="container max-w-2xl">
        <Card className="overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-8 text-center text-white">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-6">
              <Check className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Thank You, {name.split(" ")[0]}!</h1>
            <p className="text-emerald-100">Your window quote has been submitted</p>
          </div>
          
          <CardContent className="p-8 space-y-8">
            {/* Discount Badge */}
            <div className="text-center">
              <Badge className="bg-yellow-400 text-yellow-900 text-lg px-6 py-2 mb-4">
                🎉 You Won {discount}% Off!
              </Badge>
              <div className="text-4xl font-bold text-emerald-700">
                ${discountedLow.toLocaleString()} - ${discountedHigh.toLocaleString()}
              </div>
              <div className="text-muted-foreground mt-2">
                You're saving up to <span className="font-semibold text-emerald-600">${savings.toLocaleString()}</span>
              </div>
            </div>

            {/* What's Next */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-center">What Happens Next?</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-lg">
                  <div className="bg-emerald-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    1
                  </div>
                  <div>
                    <div className="font-medium">We'll call you within 24 hours</div>
                    <div className="text-sm text-muted-foreground">
                      Our window specialist will confirm your quote details
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-lg">
                  <div className="bg-emerald-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    2
                  </div>
                  <div>
                    <div className="font-medium">Schedule your free home consultation</div>
                    <div className="text-sm text-muted-foreground">
                      We'll take precise measurements and finalize your quote
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-lg">
                  <div className="bg-emerald-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    3
                  </div>
                  <div>
                    <div className="font-medium">Professional installation</div>
                    <div className="text-sm text-muted-foreground">
                      Our certified team handles everything from permits to final inspection
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" size="lg" asChild>
                <a href="tel:561-815-0008" className="gap-2">
                  <Phone className="h-4 w-4" />
                  Call Now: 561-815-0008
                </a>
              </Button>
              <Button variant="outline" className="flex-1" size="lg" asChild>
                <a href="#" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Quote PDF
                </a>
              </Button>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                Your {discount}% discount is locked in for the next 7 days
              </p>
              <Link to="/green-home-solutions" className="text-emerald-600 hover:underline text-sm">
                ← Back to Green Home Improvements
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
