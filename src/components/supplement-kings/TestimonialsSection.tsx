import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const videoTestimonials = [
  {
    id: 1,
    company: "ABC Roofing Co.",
    name: "John Martinez",
    role: "Owner",
    thumbnail: "",
    quote: "Supplement Kings helped us recover an additional $45,000 on a commercial claim. Game changer!",
    growth: "300% ROI"
  },
  {
    id: 2,
    company: "Florida Storm Restoration",
    name: "Sarah Johnson",
    role: "Operations Manager",
    thumbnail: "",
    quote: "Their Xactimate reports are so detailed, adjusters rarely push back. Our supplement approval rate went from 40% to 85%.",
    growth: "112% increase"
  },
  {
    id: 3,
    company: "Sunshine State Builders",
    name: "Mike Thompson",
    role: "CEO",
    thumbnail: "",
    quote: "The 48-hour turnaround is incredible. We've been able to close more jobs and keep customers happy.",
    growth: "2x faster closings"
  },
  {
    id: 4,
    company: "Palm Beach Contractors",
    name: "David Rodriguez",
    role: "Project Manager",
    thumbnail: "",
    quote: "Best investment we've made. The team knows exactly how to document and present claims for maximum approval.",
    growth: "$250K recovered"
  },
];

const googleReviews = [
  { name: "Carlos M.", rating: 5, text: "Outstanding service! Got us an extra $28K on our insurance claim.", source: "Google" },
  { name: "Jennifer R.", rating: 5, text: "Professional, fast, and thorough. Highly recommend!", source: "Google" },
  { name: "Robert K.", rating: 5, text: "The detailed Xactimate reports made all the difference.", source: "Facebook" },
  { name: "Maria S.", rating: 5, text: "They fight for every dollar. True professionals.", source: "Google" },
  { name: "James W.", rating: 5, text: "24-hour turnaround as promised. Impressed!", source: "Facebook" },
  { name: "Lisa P.", rating: 5, text: "Recovered 3x what the insurance initially offered.", source: "Google" },
];

export function TestimonialsSection() {
  const [currentReview, setCurrentReview] = useState(0);

  const nextReview = () => {
    setCurrentReview((prev) => (prev + 1) % googleReviews.length);
  };

  const prevReview = () => {
    setCurrentReview((prev) => (prev - 1 + googleReviews.length) % googleReviews.length);
  };

  return (
    <section id="testimonials" className="py-20 bg-slate-900/50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Contractor Success Stories
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            See how we've helped contractors across Florida maximize their insurance claim settlements
          </p>
        </div>

        {/* Video Testimonials */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {videoTestimonials.map((testimonial) => (
            <Card key={testimonial.id} className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors overflow-hidden">
              <div className="aspect-video bg-slate-700 relative flex items-center justify-center">
                <Button 
                  size="icon" 
                  className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="h-6 w-6 text-white ml-1" />
                </Button>
                <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">
                  {testimonial.growth}
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-sm text-slate-300 mb-3 line-clamp-2">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p className="text-xs text-slate-400">{testimonial.role}, {testimonial.company}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Google/Facebook Reviews Carousel */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-white mb-2">What Our Clients Say</h3>
            <div className="flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-500 text-yellow-500" />
              ))}
              <span className="text-slate-400 ml-2">4.9/5 from 200+ reviews</span>
            </div>
          </div>

          <Card className="bg-slate-800/50 border-slate-700 relative">
            <CardContent className="p-8 text-center">
              <Quote className="h-8 w-8 text-blue-500/30 mx-auto mb-4" />
              <p className="text-lg text-slate-200 mb-6">
                "{googleReviews[currentReview].text}"
              </p>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[...Array(googleReviews[currentReview].rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <p className="font-semibold text-white">{googleReviews[currentReview].name}</p>
              <p className="text-sm text-slate-400">via {googleReviews[currentReview].source}</p>
            </CardContent>

            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              onClick={prevReview}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              onClick={nextReview}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </Card>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {googleReviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentReview(index)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentReview ? "bg-blue-500" : "bg-slate-600"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}