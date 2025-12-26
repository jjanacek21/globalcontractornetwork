import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface ServicePanelProps {
  icon: LucideIcon;
  title: string;
  description: string;
  link: string;
  delay?: number;
  isVisible?: boolean;
}

const ServicePanel = ({
  icon: Icon,
  title,
  description,
  link,
  delay = 0,
  isVisible = true,
}: ServicePanelProps) => {
  const navigate = useNavigate();

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-gcn-charcoal-light border border-gcn-charcoal-light hover:border-gcn-gold/50 transition-all duration-500 premium-card ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-gcn-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Content */}
      <div className="relative p-8">
        {/* Icon */}
        <div className="w-16 h-16 rounded-xl bg-gcn-gold/10 flex items-center justify-center mb-6 group-hover:bg-gcn-gold/20 group-hover:scale-110 transition-all duration-300">
          <Icon className="w-8 h-8 text-gcn-gold" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gcn-white mb-3 group-hover:text-gcn-gold transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gcn-white-muted text-sm mb-6 leading-relaxed">
          {description}
        </p>

        {/* CTA Button */}
        <Button
          onClick={() => navigate(link)}
          variant="ghost"
          className="text-gcn-gold hover:text-gcn-gold-light hover:bg-gcn-gold/10 p-0 group/btn"
        >
          Learn More
          <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </div>

      {/* Gold accent line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gcn-gold to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
};

export default ServicePanel;