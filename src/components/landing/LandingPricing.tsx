import { Check, ArrowRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Pay-As-You-Go",
    price: "Free",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "Job tracking & management",
      "5 proposals per month",
      "Basic lead capture",
      "Contractor directory listing",
      "Email support",
    ],
    cta: "Start Free",
    popular: false,
    link: "/join",
  },
  {
    name: "Pro",
    price: "$99",
    period: "/month",
    description: "For growing contractors",
    features: [
      "Everything in Free, plus:",
      "Unlimited proposals",
      "Full CRM access",
      "AI-powered measurements",
      "Payment processing",
      "Priority support",
      "Team collaboration",
      "Advanced analytics",
    ],
    cta: "Start Pro Trial",
    popular: true,
    link: "/join",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large operations",
    features: [
      "Everything in Pro, plus:",
      "Dedicated account manager",
      "Custom integrations",
      "White-label options",
      "API access",
      "Volume discounts",
      "Training & onboarding",
    ],
    cta: "Contact Sales",
    popular: false,
    link: "/consulting",
  },
];

const LandingPricing = () => {
  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Simple Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            Plans That Grow With Your Business
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free, upgrade when you're ready. No hidden fees, no long-term contracts.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative bg-card rounded-2xl p-8 border shadow-sm animate-fade-in-up ${
                plan.popular
                  ? "border-primary shadow-xl scale-105 md:scale-110"
                  : "border-border"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    <Star className="w-4 h-4 fill-current" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                asChild
                className={`w-full gap-2 ${
                  plan.popular ? "" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
                size="lg"
              >
                <Link to={plan.link}>
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>

        {/* Trust Note */}
        <p className="text-center text-muted-foreground mt-8">
          All plans include a 14-day free trial. Cancel anytime.
        </p>
      </div>
    </section>
  );
};

export default LandingPricing;
