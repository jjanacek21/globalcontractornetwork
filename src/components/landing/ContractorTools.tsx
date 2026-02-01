import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  TrendingUp, 
  Megaphone, 
  GraduationCap, 
  ShoppingBag, 
  Users, 
  DollarSign,
  Building2,
  ArrowRight,
  Sparkles,
  MapPinned
} from "lucide-react";

const tools = [
  {
    icon: Building2,
    title: "Directory Listing",
    description: "Get listed in our verified contractor directory. Attract qualified leads and showcase your work.",
    link: "/join?type=contractor",
    color: "from-blue-500 to-blue-600",
    badge: null
  },
  {
    icon: LayoutDashboard,
    title: "CRM Portal",
    description: "Manage leads, customers, and projects in one place. Track everything from first contact to completion.",
    link: "/dashboard",
    color: "from-indigo-500 to-indigo-600",
    badge: null
  },
  {
    icon: FileText,
    title: "Permit Expediting",
    description: "Fast-track permits with Permit Queens. Qualifying services and building department navigation.",
    link: "/permit-queens",
    color: "from-pink-500 to-pink-600",
    badge: null
  },
  {
    icon: TrendingUp,
    title: "Supplements & Estimating",
    description: "Maximize insurance claims with Xactimate-ready supplements. Professional estimating services.",
    link: "/supplement-kings",
    color: "from-green-500 to-green-600",
    badge: null
  },
  {
    icon: Megaphone,
    title: "Digital Marketing",
    description: "Website design, SEO, social media management. Grow your brand and generate more leads.",
    link: "/digital-marketing",
    color: "from-orange-500 to-orange-600",
    badge: null
  },
  {
    icon: GraduationCap,
    title: "Training Academy",
    description: "Certifications and courses for your team. Stay ahead with industry-leading training programs.",
    link: "/learning/auth",
    color: "from-purple-500 to-purple-600",
    badge: null
  },
  {
    icon: Users,
    title: "Contractor Social Hub",
    description: "Network with other contractors. Share knowledge, find partners, and grow together.",
    link: "/social",
    color: "from-cyan-500 to-cyan-600",
    badge: "Coming Soon"
  },
  {
    icon: DollarSign,
    title: "Referral Program",
    description: "Earn by referring customers. Get paid for every lead that converts through the network.",
    link: "/join?type=contractor",
    color: "from-yellow-500 to-yellow-600",
    badge: "Earn $$$"
  },
  {
    icon: MapPinned,
    title: "Door to Door World",
    description: "GPS-tracked canvassing with gamified challenges. Earn points for every door you knock.",
    link: "/door-to-door",
    color: "from-purple-500 to-purple-600",
    badge: "New"
  }
];

const ContractorTools = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            For Contractors
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Powerful Tools to Grow Your Business
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            From lead generation to project completion, we provide everything you need to scale your contracting business.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, index) => (
            <Card 
              key={index} 
              className="group relative overflow-hidden bg-slate-800/50 border-slate-700 hover:border-primary/50 hover:bg-slate-800 transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} group-hover:scale-110 transition-transform duration-300`}>
                    <tool.icon className="w-6 h-6 text-white" />
                  </div>
                  {tool.badge && (
                    <Badge variant={tool.badge === "Coming Soon" ? "secondary" : "default"} className={tool.badge === "Earn $$$" ? "bg-yellow-500 text-yellow-900" : ""}>
                      {tool.badge}
                    </Badge>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2 text-white group-hover:text-primary transition-colors">
                  {tool.title}
                </h3>
                <p className="text-slate-400 mb-4 text-sm leading-relaxed">
                  {tool.description}
                </p>
                <Link to={tool.link}>
                  <Button variant="ghost" className="p-0 h-auto font-semibold text-primary hover:text-primary/80 group/btn">
                    Learn More
                    <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/join?type=contractor">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all">
              Apply to Join the Network
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ContractorTools;
