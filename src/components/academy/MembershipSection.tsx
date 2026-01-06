import { Button } from "@/components/ui/button";
import { Card3D } from "@/components/crm-ui/Card3D";
import { 
  Check, 
  GraduationCap, 
  Video, 
  Users, 
  BookOpen, 
  Award,
  MessageCircle,
  Download
} from "lucide-react";

const benefits = [
  {
    icon: Video,
    title: "3 Weekly Training Calls",
    description: "1-2 hour live sessions with industry experts"
  },
  {
    icon: MessageCircle,
    title: "Live AMAs",
    description: "Ask Me Anything sessions with master tradespeople"
  },
  {
    icon: Users,
    title: "Exclusive Webinars",
    description: "Deep-dive sessions on advanced topics"
  },
  {
    icon: BookOpen,
    title: "Premium Course Library",
    description: "Full access to all premium courses"
  },
  {
    icon: GraduationCap,
    title: "Private Community",
    description: "Network with contractors nationwide"
  },
  {
    icon: Download,
    title: "Downloadable Resources",
    description: "Templates, contracts, and checklists"
  },
  {
    icon: Award,
    title: "Certificate Programs",
    description: "Earn credentials to boost your business"
  }
];

export const MembershipSection = () => {
  return (
    <section id="membership" className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <GraduationCap className="w-4 h-4" />
              Premium Membership
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Join the GCN Academy
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Take your contracting career to the next level with exclusive training, 
              live sessions, and a community of professionals.
            </p>
          </div>

          <Card3D className="p-8 md:p-12 bg-card border-2 border-primary/20">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Pricing */}
              <div className="space-y-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Monthly Membership</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-foreground">$29.99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Cancel anytime. No long-term commitment.
                  </p>
                </div>

                <Button size="lg" className="w-full text-lg py-6 bg-primary hover:bg-primary/90">
                  Start Your Free Trial
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  7-day free trial. No credit card required to start.
                </p>

                <div className="border-t border-border pt-6">
                  <h4 className="font-semibold text-foreground mb-4">What's included:</h4>
                  <ul className="space-y-3">
                    {[
                      "3 weekly training calls (1-2 hours each)",
                      "Live AMA sessions with experts",
                      "Exclusive webinars and workshops",
                      "Full premium course library access",
                      "Private community membership",
                      "Downloadable templates & contracts",
                      "Certificate programs"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground mb-4">Member Benefits:</h4>
                <div className="grid gap-4">
                  {benefits.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <benefit.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h5 className="font-medium text-foreground">{benefit.title}</h5>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card3D>
        </div>
      </div>
    </section>
  );
};
