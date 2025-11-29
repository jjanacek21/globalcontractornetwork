import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

const projects = [
  {
    title: "Commercial Flat Roof - Miami",
    before: "Severely weathered with ponding water damage",
    after: "Restored with Silicone coating system",
    beforeImg: "/placeholder.svg",
    afterImg: "/placeholder.svg",
    sqft: "25,000 SF",
    coating: "Silicone + Base"
  },
  {
    title: "Metal Roof Restoration - Fort Lauderdale",
    before: "Rust and corrosion throughout",
    after: "Protected with Elastomeric coating",
    beforeImg: "/placeholder.svg",
    afterImg: "/placeholder.svg",
    sqft: "12,000 SF",
    coating: "Elastomeric"
  },
  {
    title: "Residential Flat Roof - Boca Raton",
    before: "UV damage and minor leaks",
    after: "Sealed with Acrylic coating",
    beforeImg: "/placeholder.svg",
    afterImg: "/placeholder.svg",
    sqft: "3,500 SF",
    coating: "Acrylic + Base"
  }
];

export const BeforeAfterSlider = () => {
  const [sliderValue, setSliderValue] = useState([50]);

  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            See the <span className="text-primary">Transformation</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real projects showing dramatic improvements with professional coating systems
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {projects.map((project, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">{project.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image Comparison Container */}
                <div className="relative h-64 bg-muted rounded-lg overflow-hidden">
                  {/* Before Image */}
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600"
                    style={{
                      clipPath: `inset(0 ${100 - sliderValue[0]}% 0 0)`
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white text-center p-4 bg-black/50 rounded">
                        <p className="font-semibold mb-2">BEFORE</p>
                        <p className="text-sm">{project.before}</p>
                      </div>
                    </div>
                  </div>

                  {/* After Image */}
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600"
                    style={{
                      clipPath: `inset(0 0 0 ${sliderValue[0]}%)`
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white text-center p-4 bg-black/50 rounded">
                        <p className="font-semibold mb-2">AFTER</p>
                        <p className="text-sm">{project.after}</p>
                      </div>
                    </div>
                  </div>

                  {/* Slider Handle */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                    style={{ left: `${sliderValue[0]}%` }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                      <div className="w-1 h-4 bg-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Slider Control */}
                <Slider
                  value={sliderValue}
                  onValueChange={setSliderValue}
                  max={100}
                  step={1}
                  className="w-full"
                />

                {/* Project Details */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Size</p>
                    <p className="font-semibold">{project.sqft}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">System</p>
                    <p className="font-semibold">{project.coating}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-16 max-w-5xl mx-auto">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="pt-8 pb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">2000+</div>
                  <div className="text-sm text-muted-foreground">Roofs Restored</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">15M+</div>
                  <div className="text-sm text-muted-foreground">Square Feet Coated</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">98%</div>
                  <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">20+</div>
                  <div className="text-sm text-muted-foreground">Years in Business</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};