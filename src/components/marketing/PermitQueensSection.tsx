import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Upload,
  Bell,
  CheckCircle,
  Clock,
  ArrowRight,
} from "lucide-react";

const PermitQueensSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      icon: Upload,
      title: "Upload Documents",
      description: "Simply upload your project files",
    },
    {
      icon: FileText,
      title: "We Handle Submissions",
      description: "Our team prepares and submits everything",
    },
    {
      icon: Clock,
      title: "Track Progress",
      description: "Real-time updates in your portal",
    },
    {
      icon: CheckCircle,
      title: "Get Approved",
      description: "Receive your permits faster",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-24 bg-gcn-charcoal overflow-hidden"
    >
      {/* Blueprint-style background */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(hsla(220, 100%, 60%, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, hsla(220, 100%, 60%, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div
            className={`transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
            }`}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-gcn-gold/10 text-gcn-gold text-sm font-medium mb-4">
              Permit Queens
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gcn-white mb-6">
              Permit Expediting Made{" "}
              <span className="text-gradient-gold">Fast & Easy</span>
            </h2>
            <p className="text-gcn-white-muted text-lg mb-8 leading-relaxed">
              Upload your documents, and we'll handle the rest—submissions,
              follow-ups, corrections, and approval notifications. Avoid the
              headache of 40–60 page permit packets. Get real-time updates inside
              our portal.
            </p>

            {/* Features */}
            <div className="space-y-4 mb-8">
              {[
                "Full permit packet preparation",
                "Direct submission to building departments",
                "Correction handling & follow-ups",
                "Real-time status notifications",
                "Inspection scheduling assistance",
              ].map((feature, index) => (
                <div
                  key={feature}
                  className="flex items-center gap-3"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CheckCircle className="w-5 h-5 text-gcn-gold shrink-0" />
                  <span className="text-gcn-white-muted">{feature}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => navigate("/permit-queens")}
              size="lg"
              className="bg-gcn-gold hover:bg-gcn-gold-dark text-gcn-black font-bold px-8 group"
            >
              Submit Permit Request
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Right - Process Steps */}
          <div
            className={`transition-all duration-1000 delay-300 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
            }`}
          >
            <div className="relative">
              {/* Steps */}
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div
                    key={step.title}
                    className="relative flex items-start gap-4 p-6 bg-gcn-charcoal-light/50 rounded-xl border border-gcn-charcoal-light hover:border-gcn-gold/30 transition-colors group"
                  >
                    {/* Step number */}
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gcn-gold text-gcn-black text-sm font-bold flex items-center justify-center">
                      {index + 1}
                    </div>

                    {/* Icon */}
                    <div className="w-12 h-12 rounded-lg bg-gcn-gold/10 flex items-center justify-center shrink-0 group-hover:bg-gcn-gold/20 transition-colors">
                      <step.icon className="w-6 h-6 text-gcn-gold" />
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="text-gcn-white font-semibold text-lg mb-1">
                        {step.title}
                      </h3>
                      <p className="text-gcn-white-muted text-sm">
                        {step.description}
                      </p>
                    </div>

                    {/* Connector line */}
                    {index < steps.length - 1 && (
                      <div className="absolute left-0 top-full w-px h-6 bg-gcn-gold/30" />
                    )}
                  </div>
                ))}
              </div>

              {/* Notification preview */}
              <div className="mt-6 p-4 bg-gcn-gold/10 rounded-lg border border-gcn-gold/30 flex items-center gap-3">
                <Bell className="w-5 h-5 text-gcn-gold" />
                <div>
                  <p className="text-gcn-white text-sm font-medium">
                    New Update!
                  </p>
                  <p className="text-gcn-white-muted text-xs">
                    Your permit has been approved ✓
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PermitQueensSection;