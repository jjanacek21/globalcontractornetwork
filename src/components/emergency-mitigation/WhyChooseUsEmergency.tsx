import { 
  Clock, 
  Shield, 
  MapPin, 
  Wrench, 
  Cpu, 
  ThumbsUp,
  CheckCircle2
} from "lucide-react";

export const WhyChooseUsEmergency = () => {
  const reasons = [
    {
      icon: Clock,
      title: "24/7 Fast Response",
      description: "Always on-call with on-site arrival in 60 minutes or less, day or night. When disaster strikes, every minute counts.",
      color: "text-red-600",
      bgColor: "bg-red-100"
    },
    {
      icon: Shield,
      title: "Certified & Insured",
      description: "State-licensed mold remediators, IICRC certified, fully insured – industry experts you can trust with your home.",
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      icon: MapPin,
      title: "Local & Trusted",
      description: "A South Florida team with strong community ties and a track record of satisfied customers. We understand local weather and building needs.",
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      icon: Wrench,
      title: "One-Stop Solution",
      description: "From emergency cleanup to full rebuild, we handle every step. We also help with insurance claims to expedite your recovery.",
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      icon: Cpu,
      title: "Latest Technology",
      description: "State-of-the-art equipment including industrial HEPA air scrubbers, commercial dehumidifiers, and thermal imaging for the most effective remediation.",
      color: "text-cyan-600",
      bgColor: "bg-cyan-100"
    },
    {
      icon: ThumbsUp,
      title: "Satisfaction Guaranteed",
      description: "We stand by our work with a 100% satisfaction guarantee and follow-up to ensure your property stays safe and mold-free.",
      color: "text-amber-600",
      bgColor: "bg-amber-100"
    }
  ];

  return (
    <section id="why-us" className="py-20 bg-slate-50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Why Choose Us?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            When your home or business faces an emergency, you need a team you can rely on. 
            Here's what sets us apart.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((reason) => (
            <div
              key={reason.title}
              className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow"
            >
              <div className={`${reason.bgColor} ${reason.color} inline-flex p-3 rounded-lg mb-4`}>
                <reason.icon className="h-6 w-6" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {reason.title}
              </h3>
              
              <p className="text-slate-600">
                {reason.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom Summary */}
        <div className="mt-12 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">
            Your Family's Safety Is Our Top Priority
          </h3>
          <p className="text-slate-300 max-w-2xl mx-auto mb-6">
            Unlike some companies that just remove surface mold, we address the source and 
            guarantee mold won't return. Many contractors take days to respond – we're at 
            your door within hours because we know every minute counts.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span>Licensed & Insured</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span>IICRC Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span>20+ Years Experience</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span>5-Star Customer Rated</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
