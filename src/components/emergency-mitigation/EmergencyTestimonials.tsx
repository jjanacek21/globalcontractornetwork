import { Star, Quote } from "lucide-react";

export const EmergencyTestimonials = () => {
  const testimonials = [
    {
      name: "Maria G.",
      location: "Boca Raton",
      service: "Water Mitigation",
      rating: 5,
      text: "They arrived within an hour at 2am and saved our home from major flood damage. Professional, courteous, and worked with our insurance seamlessly. Can't thank them enough!",
      date: "October 2024"
    },
    {
      name: "James T.",
      location: "Fort Lauderdale",
      service: "Mold Remediation",
      rating: 5,
      text: "After discovering black mold in our bathroom, we called these guys. They explained everything clearly, contained the area properly, and our air quality tests came back perfect. Worth every penny for peace of mind.",
      date: "September 2024"
    },
    {
      name: "Patricia L.",
      location: "Miami",
      service: "Storm Damage",
      rating: 5,
      text: "Hurricane damage to our roof had water pouring in. They tarped the roof same day and handled the entire cleanup and restoration. They even helped us with the insurance claim. True professionals.",
      date: "August 2024"
    }
  ];

  return (
    <section className="py-20 bg-slate-900 text-white">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Our Customers Say
          </h2>
          <div className="flex items-center justify-center gap-2 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-current" />
            ))}
            <span className="ml-2 text-white">5.0 Rating • 100+ Verified Reviews</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-slate-800 rounded-2xl p-6 relative"
            >
              <Quote className="absolute top-4 right-4 h-10 w-10 text-slate-700" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              
              {/* Text */}
              <p className="text-slate-300 mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>
              
              {/* Author */}
              <div className="border-t border-slate-700 pt-4">
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-slate-400">
                  {testimonial.location} • {testimonial.service}
                </p>
                <p className="text-xs text-slate-500 mt-1">{testimonial.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
