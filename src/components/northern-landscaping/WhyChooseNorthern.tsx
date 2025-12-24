import {
  Shield,
  Award,
  Clock,
  Users,
  Wrench,
  HeartHandshake,
} from "lucide-react";

const reasons = [
  {
    icon: Shield,
    title: "$2M+ Liability Coverage",
    description:
      "Fully licensed and insured with comprehensive coverage to protect your property and our team.",
  },
  {
    icon: Award,
    title: "ISA Certified Arborists",
    description:
      "Our tree care professionals hold certifications from the International Society of Arboriculture.",
  },
  {
    icon: Clock,
    title: "Same-Day Emergency Service",
    description:
      "Storm damage? We're available 24/7 for urgent tree removal and property protection.",
  },
  {
    icon: Users,
    title: "Local Florida Experts",
    description:
      "Born and raised in South Florida. We understand local species, soil, and climate like no one else.",
  },
  {
    icon: Wrench,
    title: "Premium Equipment",
    description:
      "State-of-the-art machinery including bucket trucks, cranes, and professional-grade tools.",
  },
  {
    icon: HeartHandshake,
    title: "100% Satisfaction Guarantee",
    description:
      "We stand behind every project. Your complete satisfaction is our top priority.",
  },
];

const WhyChooseNorthern = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-green-50 to-white">
      <div className="container">
        <div className="text-center mb-16">
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wide">
            Why Choose Us
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-green-900 mt-2 mb-4">
            The Northern Landscaping Difference
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            When you choose Northern Landscaping, you're choosing excellence,
            reliability, and peace of mind.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((reason) => (
            <div
              key={reason.title}
              className="flex gap-4 p-6 rounded-xl bg-white shadow-sm border border-green-100"
            >
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <reason.icon className="h-6 w-6 text-green-700" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-green-900 text-lg mb-2">
                  {reason.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {reason.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseNorthern;
