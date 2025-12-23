import { Shield, Award, CheckCircle2, Building2, Star } from "lucide-react";

export const TrustBadges = () => {
  const badges = [
    {
      icon: Shield,
      title: "IICRC Certified",
      description: "Water Restoration & Mold Remediation",
      color: "bg-blue-600"
    },
    {
      icon: Award,
      title: "Florida Licensed",
      description: "DBPR Mold Remediator License",
      color: "bg-green-600"
    },
    {
      icon: CheckCircle2,
      title: "NORMI Certified",
      description: "Mold Inspection Experts",
      color: "bg-purple-600"
    },
    {
      icon: Building2,
      title: "BBB Accredited",
      description: "A+ Rating",
      color: "bg-amber-600"
    },
    {
      icon: Star,
      title: "5-Star Rated",
      description: "100+ Verified Reviews",
      color: "bg-red-600"
    }
  ];

  return (
    <section className="py-12 bg-slate-100">
      <div className="container">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
            Licensed & Insured • IICRC Certified • 20+ Years Experience
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {badges.map((badge) => (
            <div
              key={badge.title}
              className="flex flex-col items-center text-center p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`${badge.color} p-3 rounded-lg mb-3`}>
                <badge.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">{badge.title}</h3>
              <p className="text-xs text-slate-600 mt-1">{badge.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600">
            We work with all major insurance companies to expedite your claim
          </p>
          <div className="flex flex-wrap justify-center gap-8 mt-4 opacity-60 grayscale">
            <span className="text-lg font-bold text-slate-500">State Farm</span>
            <span className="text-lg font-bold text-slate-500">Allstate</span>
            <span className="text-lg font-bold text-slate-500">Citizens</span>
            <span className="text-lg font-bold text-slate-500">USAA</span>
            <span className="text-lg font-bold text-slate-500">Liberty Mutual</span>
          </div>
        </div>
      </div>
    </section>
  );
};
