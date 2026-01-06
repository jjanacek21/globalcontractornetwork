import { Link } from "react-router-dom";
import { Card3D } from "@/components/crm-ui/Card3D";
import { 
  ClipboardList, 
  Shield, 
  Building, 
  Wrench, 
  Home, 
  Video, 
  CheckSquare, 
  MapPin 
} from "lucide-react";

const categories = [
  {
    id: "licensing",
    name: "Licensing & Business",
    description: "State requirements, exams, bonds, reciprocity guides",
    icon: ClipboardList,
    count: 24,
    color: "from-blue-500/20 to-blue-600/10",
    iconColor: "text-blue-500"
  },
  {
    id: "insurance",
    name: "Insurance Guide",
    description: "GL, Workers' Comp, Umbrella policies explained",
    icon: Shield,
    count: 18,
    color: "from-emerald-500/20 to-emerald-600/10",
    iconColor: "text-emerald-500"
  },
  {
    id: "permits",
    name: "Permits & Codes",
    description: "Building codes, permit processes, compliance",
    icon: Building,
    count: 50,
    color: "from-amber-500/20 to-amber-600/10",
    iconColor: "text-amber-500"
  },
  {
    id: "products",
    name: "Product Knowledge",
    description: "Trade-specific guides for roofing, plumbing, electrical",
    icon: Wrench,
    count: 35,
    color: "from-purple-500/20 to-purple-600/10",
    iconColor: "text-purple-500"
  },
  {
    id: "homeowner",
    name: "Homeowner Resources",
    description: "Hiring tips, Q&A, project expectations",
    icon: Home,
    count: 42,
    color: "from-rose-500/20 to-rose-600/10",
    iconColor: "text-rose-500"
  },
  {
    id: "videos",
    name: "Video Library",
    description: "Tutorials, demos, expert interviews",
    icon: Video,
    count: 100,
    color: "from-red-500/20 to-red-600/10",
    iconColor: "text-red-500"
  },
  {
    id: "checklists",
    name: "Checklists & Tools",
    description: "Downloadable templates, calculators",
    icon: CheckSquare,
    count: 25,
    color: "from-cyan-500/20 to-cyan-600/10",
    iconColor: "text-cyan-500"
  },
  {
    id: "states",
    name: "State Requirements",
    description: "State-by-state licensing and compliance",
    icon: MapPin,
    count: 50,
    color: "from-indigo-500/20 to-indigo-600/10",
    iconColor: "text-indigo-500"
  }
];

export const ResourceCategoryGrid = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Free Resource Library</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about the contracting industry, organized by topic
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link key={category.id} to={`/academy/resources?category=${category.id}`}>
              <Card3D className="h-full p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <category.icon className={`w-7 h-7 ${category.iconColor}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {category.description}
                </p>
                <div className="text-xs font-medium text-primary">
                  {category.count}+ Articles
                </div>
              </Card3D>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
