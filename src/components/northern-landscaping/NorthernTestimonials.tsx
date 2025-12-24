import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Michael R.",
    location: "Palm Beach Gardens",
    rating: 5,
    text: "Northern Landscaping transformed our backyard into a tropical paradise. Their attention to detail and professionalism exceeded all expectations. Highly recommend!",
    service: "Complete Landscape Design",
  },
  {
    name: "Sandra W.",
    location: "Boca Raton",
    rating: 5,
    text: "After Hurricane Ian, they removed three massive oaks from our property in one day. Fast, safe, and the cleanup was immaculate. True professionals.",
    service: "Emergency Tree Removal",
  },
  {
    name: "David & Lisa K.",
    location: "Naples",
    rating: 5,
    text: "We've used them for years for our estate maintenance. The team is always punctual, courteous, and our property has never looked better. Worth every penny.",
    service: "Ongoing Maintenance",
  },
  {
    name: "Jennifer M.",
    location: "Fort Lauderdale",
    rating: 5,
    text: "The irrigation system they installed cut our water bill in half while keeping the lawn perfectly green. Smart, efficient work from start to finish.",
    service: "Irrigation Installation",
  },
];

const NorthernTestimonials = () => {
  return (
    <section className="py-20 bg-green-900">
      <div className="container">
        <div className="text-center mb-16">
          <span className="text-green-400 font-semibold text-sm uppercase tracking-wide">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mt-2 mb-4">
            What Our Clients Say
          </h2>
          <p className="text-lg text-green-200 max-w-2xl mx-auto">
            Don't just take our word for it – hear from homeowners across South
            Florida.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur rounded-xl p-8 relative"
            >
              <Quote className="absolute top-6 right-6 h-10 w-10 text-green-400/30" />

              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              <p className="text-white/90 text-lg leading-relaxed mb-6">
                "{testimonial.text}"
              </p>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p className="text-green-300 text-sm">{testimonial.location}</p>
                </div>
                <span className="text-xs text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
                  {testimonial.service}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-green-300">
            ⭐ Rated 5.0 on Google with 150+ reviews
          </p>
        </div>
      </div>
    </section>
  );
};

export default NorthernTestimonials;
