import { Button } from "@/components/ui/button";
import { Shield, Star, Award, ThumbsUp } from "lucide-react";

export const GreenHomeHero = () => {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-white space-y-8">
            <div className="inline-flex items-center gap-2 bg-yellow-400/20 text-yellow-400 px-4 py-2 rounded-full text-sm font-medium">
              <Award className="h-4 w-4" />
              Premium Impact Windows & Doors
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Premium Impact Windows for{" "}
              <span className="text-yellow-400">South Florida</span>
            </h1>
            
            <p className="text-xl text-emerald-100">
              Hurricane protection, energy efficiency, and noise reduction. 
              Get an instant quote using our window calculator and save up to 25% today!
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-yellow-400 text-gray-900 hover:bg-yellow-300 font-bold text-lg h-14 px-8"
                onClick={() => document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Get Your Free Estimate
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-transparent border-white text-white hover:bg-white/10 h-14 px-8"
                asChild
              >
                <a href="tel:561-815-0008">Call 561-815-0008</a>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="bg-white/10 p-2 rounded-lg">
                  <Star className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <div className="font-semibold">4.9 Rating</div>
                  <div className="text-emerald-200 text-xs">Google Reviews</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="bg-white/10 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <div className="font-semibold">BBB A+</div>
                  <div className="text-emerald-200 text-xs">Accredited</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="bg-white/10 p-2 rounded-lg">
                  <ThumbsUp className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <div className="font-semibold">2,500+</div>
                  <div className="text-emerald-200 text-xs">Projects Done</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Image/Stats Card */}
          <div className="relative hidden lg:block">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-8 border border-white/20">
              <div className="text-center text-white mb-8">
                <h3 className="text-2xl font-bold mb-2">Why Choose Impact Windows?</h3>
                <p className="text-emerald-200">Benefits for South Florida homes</p>
              </div>
              
              <div className="space-y-6">
                {[
                  { title: "Hurricane Protection", desc: "Category 5 rated impact resistance" },
                  { title: "Energy Savings", desc: "Up to 40% reduction in energy bills" },
                  { title: "Noise Reduction", desc: "Block up to 75% of outside noise" },
                  { title: "UV Protection", desc: "99% UV ray blocking" },
                  { title: "Insurance Discounts", desc: "Qualify for up to 45% premium reduction" },
                  { title: "Home Value", desc: "Increase property value by 10-15%" },
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="bg-yellow-400 text-emerald-900 rounded-full p-1 mt-0.5">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold">{benefit.title}</div>
                      <div className="text-sm text-emerald-200">{benefit.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
