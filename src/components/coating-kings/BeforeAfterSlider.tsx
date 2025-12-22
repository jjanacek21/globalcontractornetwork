import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import beforeAfterComposite from "@/assets/coating-kings/before-after-composite.png";

const projects = [
  {
    title: "Metal Storage Roof - Rusty to White",
    before: "Severe rust and corrosion damage",
    after: "Restored with white coating system",
    sqft: "8,000 SF",
    coating: "Silicone + Primer",
    // First row: top 0-33%
    imagePosition: "0% 0%",
  },
  {
    title: "Commercial Flat Roof - Damaged to Sealed",
    before: "UV damage and surface deterioration",
    after: "Protected with elastomeric coating",
    sqft: "15,000 SF",
    coating: "Elastomeric",
    // Second row: middle 33-66%
    imagePosition: "0% 50%",
  },
  {
    title: "Metal Roof - Rusty to Blue Coating",
    before: "Extensive rust throughout",
    after: "Sealed with premium blue coating",
    sqft: "12,000 SF",
    coating: "Acrylic + Base",
    // Third row: bottom 66-100%
    imagePosition: "0% 100%",
  }
];

export const BeforeAfterSlider = () => {
  const [sliderValues, setSliderValues] = useState<{ [key: number]: number[] }>({
    0: [50],
    1: [50],
    2: [50],
  });

  const handleSliderChange = (index: number, value: number[]) => {
    setSliderValues((prev) => ({ ...prev, [index]: value }));
  };

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
          {projects.map((project, index) => {
            const sliderValue = sliderValues[index] || [50];
            
            return (
              <Card key={index} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Image Comparison Container */}
                  <div className="relative h-64 bg-muted rounded-lg overflow-hidden">
                    {/* Before Image (Left side) */}
                    <div
                      className="absolute inset-0"
                      style={{
                        clipPath: `inset(0 ${100 - sliderValue[0]}% 0 0)`,
                      }}
                    >
                      <div 
                        className="absolute inset-0 bg-cover"
                        style={{
                          backgroundImage: `url(${beforeAfterComposite})`,
                          backgroundPosition: project.imagePosition,
                          backgroundSize: "200% 300%",
                        }}
                      />
                      <span className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm font-semibold">
                        BEFORE
                      </span>
                    </div>

                    {/* After Image (Right side) */}
                    <div
                      className="absolute inset-0"
                      style={{
                        clipPath: `inset(0 0 0 ${sliderValue[0]}%)`,
                      }}
                    >
                      <div 
                        className="absolute inset-0 bg-cover"
                        style={{
                          backgroundImage: `url(${beforeAfterComposite})`,
                          backgroundPosition: `100% ${project.imagePosition.split(' ')[1]}`,
                          backgroundSize: "200% 300%",
                        }}
                      />
                      <span className="absolute bottom-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded text-sm font-semibold">
                        AFTER
                      </span>
                    </div>

                    {/* Slider Handle */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
                      style={{ left: `${sliderValue[0]}%` }}
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-primary">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Slider Control */}
                  <Slider
                    value={sliderValue}
                    onValueChange={(value) => handleSliderChange(index, value)}
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
            );
          })}
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
