import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Mike Thompson",
    company: "Thompson Roofing Co.",
    location: "Miami, FL",
    rating: 5,
    text: "GCN has completely transformed how we manage our business. From lead capture to final payment, everything is in one place. We've increased our close rate by 40%!",
    image: null,
  },
  {
    name: "Sarah Martinez",
    company: "Elite Home Solutions",
    location: "Fort Lauderdale, FL",
    rating: 5,
    text: "The instant quote tool alone has saved us countless hours. Customers love getting estimates on the spot, and we love closing more deals. Highly recommend!",
    image: null,
  },
  {
    name: "James Wilson",
    company: "Wilson Construction",
    location: "Tampa, FL",
    rating: 5,
    text: "Estimating & Supplementing helped us recover an additional $85,000 on insurance claims last year. The ROI on GCN is incredible. Best investment we've made.",
    image: null,
  },
];

const LandingTestimonials = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary to-primary/80 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10">
          <Quote className="w-32 h-32 text-primary-foreground" />
        </div>
        <div className="absolute bottom-10 right-10">
          <Quote className="w-32 h-32 text-primary-foreground rotate-180" />
        </div>
      </div>

      <div className="container relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Trusted by Contractors Everywhere
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            See what our members are saying about the Global Contractor Network
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-background rounded-2xl p-8 shadow-xl animate-fade-in-up"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.company} • {testimonial.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "500+", label: "5-Star Reviews" },
            { value: "1,000+", label: "Active Members" },
            { value: "98%", label: "Satisfaction Rate" },
            { value: "24/7", label: "Support Available" },
          ].map((stat, i) => (
            <div key={i}>
              <p className="text-3xl md:text-4xl font-bold text-primary-foreground">
                {stat.value}
              </p>
              <p className="text-primary-foreground/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingTestimonials;
