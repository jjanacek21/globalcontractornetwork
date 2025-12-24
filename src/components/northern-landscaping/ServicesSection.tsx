import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  TreeDeciduous,
  Droplets,
  Lightbulb,
  Scissors,
  Wind,
  Mountain,
  CircleDot,
  Flower2,
  Sparkles,
  Bug,
  Home,
  Waves,
  Zap,
  LayoutGrid,
  Apple,
  Leaf,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const services = [
  {
    icon: Leaf,
    title: "Lawn Maintenance",
    description:
      "Weekly mowing, edging, and seasonal lawn care programs to keep your property pristine year-round.",
  },
  {
    icon: Droplets,
    title: "Irrigation",
    description:
      "Smart irrigation system design, installation, and repair. Water-efficient solutions for lush landscapes.",
  },
  {
    icon: Lightbulb,
    title: "Landscape Lighting",
    description:
      "Custom outdoor lighting design to enhance beauty, safety, and ambiance after dark.",
  },
  {
    icon: TreeDeciduous,
    title: "Tree Trimming & Arbor Care",
    description:
      "Professional pruning, crown reduction, and health assessments by certified arborists.",
  },
  {
    icon: Wind,
    title: "Storm Cleanup",
    description:
      "24/7 emergency storm damage cleanup. Rapid response to fallen trees and debris removal.",
  },
  {
    icon: Mountain,
    title: "Land Grading",
    description:
      "Expert grading and drainage solutions to prevent flooding and prepare sites for landscaping.",
  },
  {
    icon: CircleDot,
    title: "Stump Grinding",
    description:
      "Complete stump removal and grinding. Reclaim your yard space safely and efficiently.",
  },
  {
    icon: Flower2,
    title: "Artificial Turf",
    description:
      "Premium synthetic turf installation for a perfect lawn year-round with zero maintenance.",
  },
  {
    icon: Sparkles,
    title: "Artificial Turf Cleaning",
    description:
      "Professional cleaning and maintenance to keep your artificial turf looking fresh and hygienic.",
  },
  {
    icon: Bug,
    title: "Pest Control",
    description:
      "Integrated pest management for lawns and landscapes. Protect your investment from harmful pests.",
  },
  {
    icon: Home,
    title: "Tiki Huts & Pergolas",
    description:
      "Custom outdoor living structures. Authentic tiki huts and modern pergola designs.",
  },
  {
    icon: Waves,
    title: "Waterfalls",
    description:
      "Natural and pondless waterfall design and installation. Create a serene backyard oasis.",
  },
  {
    icon: Zap,
    title: "Pressure Cleaning",
    description:
      "High-powered cleaning for driveways, patios, pool decks, and building exteriors.",
  },
  {
    icon: LayoutGrid,
    title: "Pavers",
    description:
      "Paver installation, repair, and sealing for driveways, walkways, and patios.",
  },
  {
    icon: Apple,
    title: "Fruit Tree Installation",
    description:
      "Tropical and citrus fruit tree selection and planting. Enjoy fresh fruit from your own yard.",
  },
  {
    icon: Scissors,
    title: "Fertilization Programs",
    description:
      "Custom fertilization schedules tailored to South Florida's climate for optimal plant health.",
  },
];

const ServicesSection = () => {
  const [showAll, setShowAll] = useState(false);
  const displayedServices = showAll ? services : services.slice(0, 8);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="services" className="py-20 bg-gradient-to-b from-white to-green-50">
      <div className="container">
        <div className="text-center mb-16">
          <span className="text-green-600 font-semibold text-sm uppercase tracking-wide">
            Our Services
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-green-900 mt-2 mb-4">
            Complete Landscaping Solutions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From routine maintenance to complete landscape transformations, we
            offer comprehensive services for residential and commercial properties.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedServices.map((service) => (
            <div
              key={service.title}
              className="group bg-white rounded-xl p-6 shadow-sm border border-green-100 hover:shadow-lg hover:border-green-300 transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                <service.icon className="h-6 w-6 text-green-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                {service.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-6 mt-12">
          {services.length > 8 && (
            <Button
              variant="outline"
              onClick={() => setShowAll(!showAll)}
              className="border-green-600 text-green-700 hover:bg-green-50 gap-2"
            >
              {showAll ? (
                <>
                  Show Less <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  View All {services.length} Services <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          )}

          <Button
            size="lg"
            onClick={() => scrollToSection("contact")}
            className="bg-green-700 hover:bg-green-800 text-white px-10"
          >
            Flourish Your Space - Get a Quote
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
