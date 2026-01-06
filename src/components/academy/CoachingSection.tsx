import { Button } from "@/components/ui/button";
import { Card3D } from "@/components/crm-ui/Card3D";
import { 
  UserCircle, 
  Target, 
  TrendingUp, 
  Users, 
  Calendar,
  ArrowRight
} from "lucide-react";

const coachingAreas = [
  {
    icon: Target,
    title: "Business Launch Strategy",
    description: "Start your contracting business the right way with licensing, insurance, and market positioning."
  },
  {
    icon: TrendingUp,
    title: "Scaling Operations",
    description: "Grow from solo contractor to multi-crew operation with systems that work."
  },
  {
    icon: Users,
    title: "Sales & Marketing",
    description: "Build a lead generation machine and close more deals with proven techniques."
  },
  {
    icon: UserCircle,
    title: "Team Building",
    description: "Hire, train, and retain top talent while building a winning culture."
  }
];

export const CoachingSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary-foreground px-4 py-2 rounded-full text-sm font-medium">
                <UserCircle className="w-4 h-4" />
                Premium Coaching
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                1-on-1 Business Coaching
              </h2>
              
              <p className="text-lg text-muted-foreground">
                Get personalized guidance for your specific business challenges. 
                Whether you're just starting out or looking to scale to the next level, 
                our expert coaches will create a custom roadmap for your success.
              </p>

              <div className="grid gap-4">
                {coachingAreas.map((area, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <area.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{area.title}</h4>
                      <p className="text-sm text-muted-foreground">{area.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button size="lg" className="mt-4">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule a Consultation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Visual */}
            <Card3D className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5">
              <div className="text-center space-y-6">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <UserCircle className="w-12 h-12 text-primary" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Custom Pricing
                  </h3>
                  <p className="text-muted-foreground">
                    Tailored to your personal and business needs
                  </p>
                </div>

                <div className="border-t border-border pt-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Session Duration</span>
                    <span className="font-medium text-foreground">60-90 minutes</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Frequency</span>
                    <span className="font-medium text-foreground">Weekly or Bi-weekly</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Format</span>
                    <span className="font-medium text-foreground">Video or Phone</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Support</span>
                    <span className="font-medium text-foreground">Email & Text</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Book a free 15-minute discovery call to discuss your goals
                </p>
              </div>
            </Card3D>
          </div>
        </div>
      </div>
    </section>
  );
};
