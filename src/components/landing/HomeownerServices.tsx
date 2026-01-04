import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Home, 
  Wrench, 
  Droplets, 
  TreeDeciduous, 
  Shield, 
  Search, 
  Calendar, 
  AlertTriangle,
  ArrowRight
} from "lucide-react";

const services = [
  {
    icon: Search,
    title: "Contractor Directory",
    description: "Find verified, licensed contractors in your area. Read reviews, compare quotes, and hire with confidence.",
    link: "/directory",
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: Home,
    title: "Roofing Services",
    description: "Full roof replacements, repairs, and inspections. Get AI-powered instant estimates in seconds.",
    link: "/roofing",
    color: "from-orange-500 to-orange-600"
  },
  {
    icon: Shield,
    title: "Roof Coatings",
    description: "Extend your roof's life by 15+ years with Coating Kings. Protect against leaks and UV damage.",
    link: "/coating-kings",
    color: "from-yellow-500 to-yellow-600"
  },
  {
    icon: Wrench,
    title: "Windows & Doors",
    description: "Impact-rated windows and doors. Energy-efficient installations with professional service.",
    link: "/green-home-solutions",
    color: "from-green-500 to-green-600"
  },
  {
    icon: AlertTriangle,
    title: "Emergency Mitigation",
    description: "24/7 water damage, mold remediation, and storm response. Fast action when disaster strikes.",
    link: "/emergency-mitigation",
    color: "from-red-500 to-red-600"
  },
  {
    icon: Calendar,
    title: "Maintenance Membership",
    description: "Annual property protection plans. Regular inspections and priority service for members.",
    link: "/prep-property",
    color: "from-purple-500 to-purple-600"
  },
  {
    icon: Droplets,
    title: "Pre-Storm Certifications",
    description: "Hurricane prep inspections. Ensure your property is ready before storm season hits.",
    link: "/prep-property",
    color: "from-cyan-500 to-cyan-600"
  },
  {
    icon: TreeDeciduous,
    title: "Tree & Landscaping",
    description: "Professional tree removal, trimming, and landscaping services. Beautify and protect your property.",
    link: "/northern-landscaping",
    color: "from-emerald-500 to-emerald-600"
  }
];

const HomeownerServices = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            For Homeowners
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything Your Home Needs
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From emergency repairs to preventive maintenance, get instant quotes and connect with verified contractors for any project.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            >
              <CardContent className="p-6">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {service.title}
                </h3>
                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  {service.description}
                </p>
                <Link to={service.link}>
                  <Button variant="ghost" className="p-0 h-auto font-semibold text-primary hover:text-primary/80 group/btn">
                    Get Quote
                    <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/join?type=homeowner">
            <Button size="lg" className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-shadow">
              Create Free Homeowner Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeownerServices;
