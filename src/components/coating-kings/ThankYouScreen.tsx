import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Download, FileText, PlayCircle, Star, X } from "lucide-react";
import { WinnersTestimonials } from "./WinnersTestimonials";

interface ThankYouScreenProps {
  open: boolean;
  onClose: () => void;
  leadData: {
    name: string;
    discount_percent: number;
    appointment_date: string;
    appointment_time: string;
    discounted_price: number;
  };
}

const RESOURCES = [
  {
    title: "Company Overview",
    description: "Learn about Coating Kings and our commitment to quality",
    icon: FileText,
    href: "#",
  },
  {
    title: "Warranty Information",
    description: "Details on our industry-leading coating warranties",
    icon: FileText,
    href: "#",
  },
  {
    title: "Coating Systems Guide",
    description: "Comprehensive guide to our coating options",
    icon: FileText,
    href: "#",
  },
  {
    title: "FAQ Document",
    description: "Answers to frequently asked questions",
    icon: FileText,
    href: "#",
  },
];

export const ThankYouScreen = ({ open, onClose, leadData }: ThankYouScreenProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <CheckCircle className="h-8 w-8 text-green-500" />
            Thank You, {leadData.name.split(" ")[0]}!
          </DialogTitle>
        </DialogHeader>

        {/* Confirmation Card */}
        <Card className="bg-green-500/10 border-green-500">
          <CardContent className="pt-6 text-center">
            <div className="space-y-2">
              <p className="text-lg">Your <span className="font-bold text-primary">{leadData.discount_percent}% discount</span> has been reserved!</p>
              <div className="text-muted-foreground">
                <p>Site visit scheduled for:</p>
                <p className="font-semibold text-foreground text-lg">
                  {new Date(leadData.appointment_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {leadData.appointment_time}
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                A confirmation email has been sent to your inbox with all the details.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Video Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Watch: About Coating Kings</h3>
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <PlayCircle className="h-12 w-12 text-primary" />
              </div>
              <p className="text-muted-foreground">Company Introduction Video</p>
              <p className="text-sm text-muted-foreground">(Video placeholder - Add your YouTube or Vimeo embed)</p>
            </div>
          </div>
        </div>

        {/* PDF Resources */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Helpful Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {RESOURCES.map((resource) => (
              <Card key={resource.title} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <resource.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{resource.title}</h4>
                    <p className="text-xs text-muted-foreground">{resource.description}</p>
                  </div>
                  <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Winners Testimonials */}
        <WinnersTestimonials />

        <div className="flex justify-center pt-4">
          <Button onClick={onClose} size="lg">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
