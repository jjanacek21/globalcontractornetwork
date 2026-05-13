import { 
  Users, 
  Ruler, 
  FileText, 
  ClipboardCheck, 
  DollarSign, 
  CreditCard,
  ArrowRight 
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Users,
    title: "Leads",
    description: "Capture quality leads by offering instant estimates. Our smart lead management system helps you track, nurture, and convert more prospects into paying customers.",
    color: "bg-blue-500/10 text-blue-600",
    link: "/services",
  },
  {
    icon: Ruler,
    title: "Measurements",
    description: "AI-powered satellite measurements delivered fast. Get accurate roof measurements, property data, and material calculations in minutes, not hours.",
    color: "bg-green-500/10 text-green-600",
    link: "/roofing",
  },
  {
    icon: FileText,
    title: "Proposals",
    description: "Create stunning, customizable proposals that win more jobs. Professional templates with your branding that close deals faster.",
    color: "bg-purple-500/10 text-purple-600",
    link: "/join",
  },
  {
    icon: ClipboardCheck,
    title: "Permits",
    description: "Permit expediting with real-time tracking through Permit Queens. Navigate building departments efficiently and get approvals faster.",
    color: "bg-amber-500/10 text-amber-600",
    link: "/permit-queens",
  },
  {
    icon: DollarSign,
    title: "Supplements",
    description: "Insurance claim support and Xactimate estimates through Supplement Kings. Maximize your recoveries with expert negotiation.",
    color: "bg-red-500/10 text-red-600",
    link: "/supplement-kings",
  },
  {
    icon: CreditCard,
    title: "Payments",
    description: "Instant, secure payments and professional invoicing. Accept credit cards, ACH, and financing options to get paid faster.",
    color: "bg-cyan-500/10 text-cyan-600",
    link: "/join",
  },
];

const LandingFeatureCards = () => {
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Everything You Need
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            From Lead to Payment, All in One Place
          </h2>
          <p className="text-lg text-muted-foreground">
            GCN gives you a complete suite of tools designed specifically for contractors. 
            No more juggling multiple apps—manage your entire business from a single platform.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Link
              key={feature.title}
              to={feature.link}
              className="group relative bg-card rounded-2xl p-8 border border-border shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl ${feature.color} mb-6`}>
                <feature.icon className="h-7 w-7" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {feature.description}
              </p>

              {/* Link Arrow */}
              <div className="flex items-center text-primary font-medium">
                Learn more
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button size="lg" asChild className="gap-2">
            <Link to="/join">
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LandingFeatureCards;
