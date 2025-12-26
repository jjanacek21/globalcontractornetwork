import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowRight, Star } from "lucide-react";

const MerchSection = () => {
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

  const brands = [
    {
      name: "Blue Collar Baddies™",
      tagline: "Apparel for the Bold",
      products: ["Tees", "Hoodies", "Hats"],
    },
    {
      name: "Blue Collar Bad Asses™",
      tagline: "Gear That Works Hard",
      products: ["Workwear", "Accessories", "Stickers"],
    },
    {
      name: "GCN Pro Gear & Tools",
      tagline: "Professional Equipment",
      products: ["Tools", "Safety Gear", "Supplies"],
    },
  ];

  const products = [
    { name: "Classic Logo Tee", price: "$29.99", rating: 5 },
    { name: "Pro Work Hoodie", price: "$59.99", rating: 5 },
    { name: "Snapback Cap", price: "$24.99", rating: 4.8 },
    { name: "Safety Vest", price: "$34.99", rating: 5 },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-24 bg-gcn-charcoal overflow-hidden"
    >
      {/* Decorative gradient */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 0% 50%, hsl(45 100% 51% / 0.2) 0%, transparent 50%),
              radial-gradient(ellipse at 100% 50%, hsl(45 100% 51% / 0.1) 0%, transparent 50%)
            `,
          }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        {/* Header */}
        <div
          className={`text-center mb-16 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-gcn-gold/10 text-gcn-gold text-sm font-medium mb-4">
            Merchandise Store
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gcn-white mb-4">
            Shop Our <span className="text-gradient-gold">Exclusive Brands</span>
          </h2>
          <p className="text-gcn-white-muted text-lg max-w-2xl mx-auto">
            Rep the trade with pride. Premium apparel, gear, and tools for the
            hardest-working professionals.
          </p>
        </div>

        {/* Brand Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {brands.map((brand, index) => (
            <div
              key={brand.name}
              className={`group p-8 rounded-2xl bg-gcn-charcoal-light/50 border border-gcn-charcoal-light hover:border-gcn-gold/50 text-center transition-all duration-500 premium-card ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100 + 200}ms` }}
            >
              {/* Brand logo placeholder */}
              <div className="w-20 h-20 mx-auto rounded-full bg-gcn-gold/10 flex items-center justify-center mb-4 group-hover:bg-gcn-gold/20 transition-colors">
                <ShoppingBag className="w-10 h-10 text-gcn-gold" />
              </div>
              <h3 className="text-xl font-bold text-gcn-white mb-1 group-hover:text-gcn-gold transition-colors">
                {brand.name}
              </h3>
              <p className="text-gcn-white-muted text-sm mb-4">{brand.tagline}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {brand.products.map((product) => (
                  <span
                    key={product}
                    className="text-xs px-3 py-1 rounded-full bg-gcn-charcoal text-gcn-white-muted"
                  >
                    {product}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Product Preview Grid */}
        <div
          className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 transition-all duration-1000 delay-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {products.map((product) => (
            <div
              key={product.name}
              className="group p-4 bg-gcn-charcoal-light/30 rounded-xl border border-gcn-charcoal-light hover:border-gcn-gold/30 transition-all"
            >
              {/* Product image placeholder */}
              <div className="aspect-square rounded-lg bg-gcn-charcoal mb-3 flex items-center justify-center group-hover:bg-gcn-charcoal-light transition-colors">
                <ShoppingBag className="w-12 h-12 text-gcn-gold/30" />
              </div>
              <h4 className="text-gcn-white text-sm font-medium mb-1">
                {product.name}
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-gcn-gold font-bold">{product.price}</span>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-gcn-gold fill-current" />
                  <span className="text-gcn-white-muted text-xs">
                    {product.rating}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className={`text-center transition-all duration-1000 delay-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <Button
            onClick={() => navigate("/store")}
            size="lg"
            className="bg-gcn-gold hover:bg-gcn-gold-dark text-gcn-black font-bold px-8 group"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Visit Store
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default MerchSection;