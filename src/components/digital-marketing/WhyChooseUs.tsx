import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  BarChart3, 
  Zap, 
  Shield, 
  Palette, 
  DollarSign 
} from "lucide-react";

const reasons = [
  {
    icon: Target,
    title: "Built for Blue-Collar",
    description: "Our strategies are designed specifically for contractors, roofers, and trades businesses—not generic marketing templates."
  },
  {
    icon: BarChart3,
    title: "Measurable ROI",
    description: "Real analytics and transparent reporting. Track every lead, every dollar spent, and every result achieved."
  },
  {
    icon: Zap,
    title: "Unified Platform",
    description: "CRM, ads, content, and automation all working together. No more juggling multiple disconnected tools."
  },
  {
    icon: Shield,
    title: "Consistent Growth",
    description: "Steady, reliable brand growth with strategies that compound over time—not flash-in-the-pan tactics."
  },
  {
    icon: Palette,
    title: "In-House Creative",
    description: "Professional designers, copywriters, and video editors on your team. Quality content that represents your brand."
  },
  {
    icon: DollarSign,
    title: "Affordable Packages",
    description: "Agency-quality services at a fraction of the cost. Compare us to agencies charging 3× more for less."
  }
];

export function WhyChooseUs() {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4">
            Why GCN Marketing Suite
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Why Choose Us?
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            We're not just another marketing agency. We're contractors who understand contractors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((reason, index) => (
            <div 
              key={index}
              className="group p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-amber-500/30 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <reason.icon className="h-7 w-7 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-amber-400 transition-colors">
                {reason.title}
              </h3>
              <p className="text-slate-400 leading-relaxed">
                {reason.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
