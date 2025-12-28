import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "How long does it take to see results from digital marketing?",
    answer: "Results vary by service. Paid advertising (Google, Facebook) can generate leads within the first week. SEO typically takes 3-6 months to show significant organic traffic improvements. Social media growth builds steadily over 2-3 months. We provide monthly reports so you can track progress from day one."
  },
  {
    question: "What is the minimum contract length?",
    answer: "Our standard agreement is month-to-month for ongoing services, with a 30-day notice for cancellation. One-time services like website design and CRM setup are project-based. We believe in earning your business every month through results, not locking you into long-term contracts."
  },
  {
    question: "Do I need to provide content for social media?",
    answer: "No, we handle all content creation as part of our social media packages. We'll learn your brand voice, take product/service photos when needed, and create professional graphics and captions. We just need your approval before posting."
  },
  {
    question: "What CRM platforms do you work with?",
    answer: "We specialize in contractor-friendly CRMs including HubSpot, Salesforce, GoHighLevel, Jobber, and custom solutions. Our CRM setup includes training for your team and ongoing support to ensure adoption."
  },
  {
    question: "Can I upgrade or downgrade my package later?",
    answer: "Absolutely! We design our packages to grow with your business. You can upgrade anytime, and changes take effect at your next billing cycle. Downgrades also take effect at the next cycle with 30-day notice."
  },
  {
    question: "What's included in the onboarding process?",
    answer: "Onboarding includes: (1) Discovery call to understand your business and goals, (2) Access setup for all platforms, (3) Brand asset collection, (4) Strategy development, (5) Account setup and optimization, (6) Team training if applicable, (7) Launch planning. Typical onboarding takes 1-2 weeks depending on the services selected."
  },
  {
    question: "Do you guarantee results?",
    answer: "While we can't guarantee specific lead numbers (no ethical marketer can), we do guarantee our work quality and effort. We provide transparent reporting, set realistic expectations, and adjust strategies based on data. Most clients see positive ROI within 60-90 days."
  },
  {
    question: "How do you handle my ad spend budget?",
    answer: "Ad spend is separate from our management fees. You pay platforms directly (Google, Facebook) for your ads, giving you full transparency and control. We recommend starting budgets based on your goals and market, and we optimize spend monthly for best results."
  },
  {
    question: "What if I already have a website?",
    answer: "Great! We can work with your existing website. We offer website optimization and maintenance services to improve performance, SEO, and conversion rates. If a rebuild is recommended, we'll explain why and provide options."
  },
  {
    question: "How often will we communicate?",
    answer: "Communication frequency depends on your package: Local Essentials includes monthly email reports, Digital Growth includes bi-weekly strategy calls, and Complete Domination includes weekly calls. All clients have access to email support, and urgent matters are always addressed promptly."
  },
  {
    question: "Can you help with branding beyond logos?",
    answer: "Yes! Our Branding Package includes logo design, color palette, typography, brand voice guidelines, and collateral templates. We ensure your brand is consistent across all marketing channels."
  },
  {
    question: "What makes you different from other agencies?",
    answer: "We specialize exclusively in contractors and home service businesses. This means we understand your industry, customers, and challenges. Our team has 10+ years of contractor marketing experience, and we've helped 500+ businesses grow. We're partners, not just vendors."
  }
];

export function MarketingFAQ() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2 mb-4">
            <HelpCircle className="h-4 w-4 text-slate-600" />
            <span className="text-slate-600 text-sm font-medium">Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
            Got Questions? We've Got Answers
          </h2>
          <p className="text-xl text-slate-600">
            Everything you need to know about our services, contracts, and process.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-slate-50 rounded-xl border border-slate-200 px-6 data-[state=open]:bg-slate-100"
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
}
