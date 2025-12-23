import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export const EmergencyFAQSection = () => {
  const faqs = [
    {
      question: "Is mold dangerous to my health?",
      answer: "Yes, certain molds can cause significant health problems, especially for those with allergies, asthma, or compromised immune systems. Black mold (Stachybotrys) can produce mycotoxins that cause respiratory issues, headaches, and other symptoms. That's why professional removal with proper containment and PPE is essential – not just for getting rid of the mold, but for ensuring your property is safe and healthy afterward."
    },
    {
      question: "Can I remove mold myself, or do I need a professional?",
      answer: "For very small areas (under 10 square feet), you might handle surface cleaning yourself with proper precautions. However, Florida law requires professional remediation for areas over 10 square feet, which makes sense – mold spreads easily through spores if not properly contained. If you're dealing with water damage, black mold, or mold in HVAC systems, always call a professional. DIY attempts often make the problem worse and more expensive to fix."
    },
    {
      question: "How soon should I act after a water leak or flood?",
      answer: "Immediately – within 24-48 hours is critical. Mold can start growing in as little as 24 hours in humid conditions like South Florida's. The longer water sits, the more damage occurs: wood warps, drywall crumbles, and mold colonies establish themselves. Quick action on water mitigation can save thousands of dollars by preventing secondary mold damage. That's why we offer 24/7 emergency response."
    },
    {
      question: "Will my insurance cover mold and water damage?",
      answer: "It depends on the cause. Most homeowner policies cover water damage from sudden events (burst pipes, storms) but may exclude mold or have coverage limits. Flood damage typically requires separate flood insurance. We work directly with all major insurance companies and can help you navigate the claims process. We'll document everything properly to maximize your coverage."
    },
    {
      question: "What certifications should a mold remediation company have?",
      answer: "In Florida, mold remediators must hold a DBPR (Department of Business and Professional Regulation) Mold Remediator License. Beyond that, look for IICRC certifications (WRT for water restoration, AMRT for mold remediation) and NORMI certification. These ensure technicians have proper training in industry-standard protocols. We maintain all these certifications and undergo ongoing education."
    },
    {
      question: "How long does mold remediation take?",
      answer: "It varies based on the extent of the problem. A small area (under 10 sq ft) might take 1-3 days. A room or two typically takes 3-5 days. Extensive whole-home remediation can take 1-2 weeks. This includes containment setup, removal, cleaning, drying, and air quality clearance testing. We provide a timeline estimate during our initial assessment."
    },
    {
      question: "Do you offer free inspections?",
      answer: "Yes! We offer free initial consultations and on-site assessments for remediation work. For formal mold testing with lab analysis and detailed reports (needed for real estate transactions or post-remediation clearance), there's a fee of $300-$600, which we credit toward your remediation if you proceed with our company."
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <HelpCircle className="h-4 w-4" />
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Common Questions Answered
          </h2>
          <p className="text-lg text-slate-600">
            Get the information you need to make informed decisions about your property
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-slate-200 rounded-xl px-6 bg-slate-50"
            >
              <AccordionTrigger className="text-left font-semibold text-slate-900 hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
