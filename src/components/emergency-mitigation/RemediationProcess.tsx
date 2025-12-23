import { 
  Phone, 
  Search, 
  Shield, 
  Wind, 
  Trash2, 
  Sparkles, 
  Hammer,
  CheckCircle2
} from "lucide-react";

export const RemediationProcess = () => {
  const steps = [
    {
      number: 1,
      icon: Phone,
      title: "Emergency Contact",
      description: "We're available 24/7 to take your call. We'll ask key questions to prepare our team for rapid deployment.",
      color: "bg-red-600"
    },
    {
      number: 2,
      icon: Search,
      title: "Inspection & Assessment",
      description: "Certified inspectors identify all mold and water sources using thermal imaging and moisture meters.",
      color: "bg-blue-600"
    },
    {
      number: 3,
      icon: Shield,
      title: "Containment",
      description: "We isolate affected areas with plastic barriers and negative air pressure to prevent spread (Florida requires this for areas over 10 sq ft).",
      color: "bg-purple-600"
    },
    {
      number: 4,
      icon: Wind,
      title: "Air Filtration",
      description: "Industrial HEPA air scrubbers remove mold spores from the air, ensuring clean breathing conditions.",
      color: "bg-cyan-600"
    },
    {
      number: 5,
      icon: Trash2,
      title: "Mold Removal",
      description: "We remove and dispose of mold-infested materials (drywall, carpet, etc.) and apply antimicrobials to stop future growth.",
      color: "bg-amber-600"
    },
    {
      number: 6,
      icon: Sparkles,
      title: "Cleaning & Sanitization",
      description: "Contents and surfaces are cleaned, deodorized, and sanitized. We can clean personal items and HVAC systems if needed.",
      color: "bg-green-600"
    },
    {
      number: 7,
      icon: Hammer,
      title: "Restoration",
      description: "We repair and rebuild, whether it's minor drywall replacement or larger reconstruction, to return your home to pre-loss condition.",
      color: "bg-slate-700"
    }
  ];

  return (
    <section id="process" className="py-20 bg-slate-50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Our Proven Remediation Process
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            All work follows IICRC S500/S520 guidelines for water and mold remediation. 
            We handle everything from start to finish.
          </p>
        </div>

        {/* Desktop Timeline */}
        <div className="hidden lg:block relative">
          {/* Connecting Line */}
          <div className="absolute top-24 left-0 right-0 h-1 bg-slate-200" />
          
          <div className="grid grid-cols-7 gap-4">
            {steps.map((step, index) => (
              <div key={step.number} className="relative text-center">
                {/* Step Circle */}
                <div className="relative z-10 mb-4">
                  <div className={`${step.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg`}>
                    <step.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow font-bold text-sm">
                    {step.number}
                  </div>
                </div>
                
                <h3 className="font-bold text-slate-900 mb-2 text-sm">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile/Tablet Timeline */}
        <div className="lg:hidden space-y-6">
          {steps.map((step, index) => (
            <div key={step.number} className="flex gap-4">
              {/* Left side: Icon and line */}
              <div className="flex flex-col items-center">
                <div className={`${step.color} w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <step.icon className="h-5 w-5 text-white" />
                </div>
                {index < steps.length - 1 && (
                  <div className="w-0.5 flex-1 bg-slate-200 my-2" />
                )}
              </div>
              
              {/* Right side: Content */}
              <div className="pb-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded">
                    Step {step.number}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{step.title}</h3>
                <p className="text-sm text-slate-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Compliance Note */}
        <div className="mt-12 bg-white rounded-xl p-6 border border-slate-200 flex items-start gap-4">
          <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-slate-900 mb-1">Florida Compliance Guaranteed</h4>
            <p className="text-sm text-slate-600">
              Our team follows Florida's mold remediation regulations closely. We prepare written remediation plans, 
              maintain proper containment for areas over 10 sq ft, and separate testing from remediation to avoid 
              conflicts of interest (as required by Florida law). All structural repairs comply with Florida Building Code.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
