import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export const WindowFAQ = () => {
  const faqs = [
    {
      question: "How much do impact windows cost in South Florida?",
      answer: "Impact window prices in South Florida typically range from $1,100 to $5,000 per window installed, depending on size, style, and performance grade. Sliding glass doors range from $4,800 to $10,500. Use our instant quote calculator above for accurate pricing based on your specific needs."
    },
    {
      question: "Do impact windows really lower insurance premiums?",
      answer: "Yes! Florida law requires insurance companies to offer discounts for hurricane mitigation. Impact windows can qualify you for discounts of up to 45% on your wind insurance premium. We provide all documentation needed for your insurance company."
    },
    {
      question: "What's the difference between impact windows and hurricane shutters?",
      answer: "Impact windows provide 24/7 protection without any action required - no deploying shutters before a storm. They also offer year-round benefits like energy savings, UV protection, and noise reduction. Shutters are less expensive upfront but require installation before each storm."
    },
    {
      question: "How long does installation take?",
      answer: "Most residential window installations take 1-3 days depending on the number of windows. We complete all permitting, installation, and final inspection. Your home remains secure throughout the process - we never leave openings overnight."
    },
    {
      question: "What warranties do you offer?",
      answer: "We offer tiered warranties based on the product grade: 5 years for Standard Grade, 10 years for Enhanced Grade, and Lifetime warranty for Premium Grade windows. All warranties cover both product and installation."
    },
    {
      question: "Do you offer financing?",
      answer: "Yes! We offer multiple financing options including 0% interest for 24 months (Same as Cash), low fixed-rate financing at 6.99% APR, and extended payment plans with low monthly payments. Most customers qualify for same-day approval."
    },
    {
      question: "Are permits required for window replacement?",
      answer: "Yes, Florida requires permits for impact window installation. We handle all permitting, scheduling of inspections, and ensure your installation meets all Florida Building Code requirements for High-Velocity Hurricane Zones (HVHZ)."
    },
    {
      question: "Can I customize the look of my impact windows?",
      answer: "Absolutely! We offer multiple frame colors for both interior and exterior, various grid patterns (Colonial, Prairie, Modern, or no grids), and different glass tint options. Our design consultant will help you choose options that complement your home."
    },
    {
      question: "What areas do you serve?",
      answer: "We serve all of South Florida including Palm Beach County, Broward County, and Miami-Dade County. This includes cities like West Palm Beach, Boca Raton, Fort Lauderdale, Pompano Beach, Miami, Coral Gables, and more."
    },
    {
      question: "How do I get started?",
      answer: "Simply use our instant quote calculator above to get a ballpark estimate, then spin the wheel for an exclusive discount! Schedule a free in-home consultation where we'll take precise measurements and provide a detailed written quote."
    }
  ];

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="container max-w-4xl">
        <div className="text-center mb-16">
          <Badge className="bg-emerald-100 text-emerald-700 mb-4">FAQ</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about impact windows in Florida
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-white rounded-lg border px-6"
            >
              <AccordionTrigger className="text-left hover:no-underline hover:text-emerald-600">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Still have questions? We're here to help!
          </p>
          <a 
            href="tel:561-815-0008" 
            className="text-emerald-600 font-semibold text-lg hover:underline"
          >
            Call us at 561-815-0008
          </a>
        </div>
      </div>
    </section>
  );
};
