import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const faqs = [
  {
    question: "How long do roof coatings last?",
    answer: "Roof coating lifespan varies by type. Acrylic coatings typically last 10-15 years, while premium silicone and polyurethane systems can last 20-30 years with proper maintenance. Our warranties range from 10 to 20+ years depending on the system chosen."
  },
  {
    question: "What warranty options are available?",
    answer: "We offer comprehensive warranties ranging from 10 to 20+ years, covering both materials and labor. Our premium silicone systems come with extended warranties that cover the entire roof system, including ponding water protection. All warranties are transferable to new property owners."
  },
  {
    question: "Can coatings be applied to both flat and metal roofs?",
    answer: "Yes! We have specialized coating systems for different roof types. Flat roofs typically use acrylic, elastomeric, or silicone coatings, while metal roofs are best served by elastomeric or polyurethane systems. Our experts will recommend the optimal solution for your specific roof type and condition."
  },
  {
    question: "How much can I save on energy costs?",
    answer: "Reflective roof coatings can reduce cooling costs by 20-30% in South Florida's hot climate. White or light-colored coatings reflect up to 90% of solar radiation, significantly reducing heat absorption. Most commercial clients see ROI within 3-5 years through energy savings alone."
  },
  {
    question: "How long does installation typically take?",
    answer: "Installation time varies by roof size and complexity. Residential roofs (1,000-5,000 SF) typically take 1-3 days. Commercial projects (10,000+ SF) may take 5-10 days. Unlike tear-off replacements, your building remains operational throughout the process, and there's minimal disruption to business operations."
  },
  {
    question: "Why are roof coatings ideal for South Florida?",
    answer: "South Florida's intense UV rays, hurricanes, and tropical storms make roof coatings an ideal solution. Our systems are specifically formulated to withstand hurricane-force winds, resist UV degradation, and handle ponding water common in flat roofs. The reflective properties also combat extreme heat, reducing cooling costs year-round."
  },
  {
    question: "What is Section 179 and how does it apply to roof coatings?",
    answer: "Section 179 of the IRS tax code allows businesses to deduct the full purchase price of qualifying equipment and software purchased or financed during the tax year. Roof coatings may qualify as they restore and improve the property. This can provide significant tax benefits for commercial property owners. We recommend consulting with your tax advisor to determine your specific eligibility and benefits."
  },
  {
    question: "How do I prepare my roof for coating?",
    answer: "Proper preparation is critical for coating success. We thoroughly clean the roof surface, repair any damage, address ponding water issues, and ensure proper adhesion. Our team handles all preparation work, including power washing, debris removal, and minor repairs. The roof must be completely dry before application."
  },
  {
    question: "Can a coated roof be recoated in the future?",
    answer: "Absolutely! One of the major advantages of roof coatings is that they can be recoated multiple times, extending the roof's life indefinitely with proper maintenance. Recoating typically costs 40-60% less than the initial application and can be done every 10-15 years depending on the system."
  },
  {
    question: "What makes your coating systems hurricane-resistant?",
    answer: "Our coatings create a seamless, monolithic membrane that bonds directly to the roof substrate. This eliminates weak points where wind-driven rain can penetrate. The flexible nature of our coatings allows them to expand and contract with the roof during storms, and they've been tested to withstand winds exceeding 150 mph."
  }
];

export const FAQSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about roof coatings and our services
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Common Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Additional Info Card */}
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">Still Have Questions?</h3>
                <p className="text-muted-foreground">
                  Our coating experts are here to help. Contact us for a free consultation 
                  and site assessment.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <a href="tel:+13055551234" className="text-primary font-semibold hover:underline">
                    📞 (305) 555-1234
                  </a>
                  <a href="mailto:info@coatingkings.com" className="text-primary font-semibold hover:underline">
                    ✉️ info@coatingkings.com
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};