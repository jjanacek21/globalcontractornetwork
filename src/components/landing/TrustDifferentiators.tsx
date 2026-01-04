import { Users, DollarSign, Shield } from "lucide-react";

const differentiators = [
  {
    icon: Users,
    title: "Network, Not Marketplace",
    description: "We build relationships between trusted professionals and property owners. This isn't about transactions — it's about long-term partnerships.",
  },
  {
    icon: DollarSign,
    title: "Contractors Don't Buy Leads",
    description: "No lead fees, no bidding wars. Contractors get quality referrals from their network, not purchased contacts who've been sold to five companies.",
  },
  {
    icon: Shield,
    title: "Homeowners Aren't Spammed",
    description: "One verified match, not ten cold calls. We connect you with the right contractor — referred by professionals who stake their reputation on it.",
  },
];

const TrustDifferentiators = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
            Why We're Different
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Referred. Verified. Accountable.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built for contractors, trusted by homeowners.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {differentiators.map((item, index) => (
            <div
              key={index}
              className="relative p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg group"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <item.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground italic">
            "A trusted network for contractors and property owners — not a lead marketplace."
          </p>
        </div>
      </div>
    </section>
  );
};

export default TrustDifferentiators;
