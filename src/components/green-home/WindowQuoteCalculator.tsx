import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight, Calculator, Check } from "lucide-react";
import { WindowSpinWheel } from "./WindowSpinWheel";
import { WindowThankYouScreen } from "./WindowThankYouScreen";
import {
  WINDOW_TYPES,
  DISCOUNTS,
  PERFORMANCE_LEVELS,
  COLORS,
  GLASS_TYPES,
  GRID_STYLES,
  EXISTING_WINDOW_TYPES,
  FINANCING_OPTIONS,
  ES_MULTIMAX_PRICES,
  getSizeOptions,
  calculateWindowPrice
} from "./windowPricing";

// Import window images
import singleHungImg from "@/assets/windows/single-hung.png";
import horizontalRollerImg from "@/assets/windows/horizontal-roller.png";
import threeLineRollerImg from "@/assets/windows/3-lite-roller.png";
import pictureWindowImg from "@/assets/windows/picture-window.png";
import slidingGlassDoorImg from "@/assets/windows/sliding-glass-door.png";
import frenchDoorImg from "@/assets/windows/french-door.png";

const WINDOW_IMAGES: Record<string, string> = {
  "single-hung": singleHungImg,
  "horizontal-roller": horizontalRollerImg,
  "3-lite-roller": threeLineRollerImg,
  "picture-window": pictureWindowImg,
  "sliding-glass-door": slidingGlassDoorImg,
  "french-door": frenchDoorImg,
};

interface WindowSelection {
  type: string;
  size: string;
  quantity: number;
}

export const WindowQuoteCalculator = () => {
  const [step, setStep] = useState(1);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [windowSelections, setWindowSelections] = useState<WindowSelection[]>([]);
  const [discountType, setDiscountType] = useState("none");
  const [performanceLevel, setPerformanceLevel] = useState("standard");
  const [interiorColor, setInteriorColor] = useState("White");
  const [exteriorColor, setExteriorColor] = useState("White");
  const [glassType, setGlassType] = useState("standard");
  const [gridStyle, setGridStyle] = useState("No Grids");
  const [existingWindowType, setExistingWindowType] = useState("");
  const [financingOption, setFinancingOption] = useState("");
  
  // Contact Info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  
  // Quote & UI State
  const [spinDiscount, setSpinDiscount] = useState<number | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimateLow, setEstimateLow] = useState(0);
  const [estimateHigh, setEstimateHigh] = useState(0);

  const totalSteps = 8;
  const progress = (step / totalSteps) * 100;

  const handleTypeToggle = (typeId: string) => {
    setSelectedTypes(prev => {
      if (prev.includes(typeId)) {
        setWindowSelections(ws => ws.filter(w => w.type !== typeId));
        return prev.filter(t => t !== typeId);
      }
      setWindowSelections(ws => [...ws, { type: typeId, size: "", quantity: 1 }]);
      return [...prev, typeId];
    });
  };

  const updateWindowSelection = (type: string, field: "size" | "quantity", value: string | number) => {
    setWindowSelections(prev => 
      prev.map(w => w.type === type ? { ...w, [field]: value } : w)
    );
  };

  const calculateTotal = () => {
    const performanceMultiplier = PERFORMANCE_LEVELS.find(p => p.id === performanceLevel)?.multiplier || 1;
    const glassMultiplier = GLASS_TYPES.find(g => g.id === glassType)?.multiplier || 1;
    const discountValue = DISCOUNTS[discountType]?.value || 0;

    let total = 0;
    windowSelections.forEach(selection => {
      if (selection.size && selection.quantity > 0) {
        const { discounted } = calculateWindowPrice(
          selection.type,
          selection.size,
          selection.quantity,
          performanceMultiplier,
          glassMultiplier,
          discountValue
        );
        total += discounted;
      }
    });

    // Installation fee (roughly 20% of window cost)
    const installationFee = total * 0.20;
    const lowEstimate = Math.round(total + installationFee * 0.8);
    const highEstimate = Math.round(total + installationFee * 1.2);

    setEstimateLow(lowEstimate);
    setEstimateHigh(highEstimate);

    return { low: lowEstimate, high: highEstimate };
  };

  const handleNext = () => {
    if (step === 1 && selectedTypes.length === 0) {
      toast.error("Please select at least one window type");
      return;
    }
    if (step === 2) {
      const incomplete = windowSelections.some(w => !w.size || w.quantity < 1);
      if (incomplete) {
        toast.error("Please complete all window selections");
        return;
      }
    }
    if (step === 7 && !existingWindowType) {
      toast.error("Please select your existing window type");
      return;
    }
    if (step === 8) {
      if (!name || !email || !phone || !address) {
        toast.error("Please fill in all required fields");
        return;
      }
      calculateTotal();
    }
    setStep(prev => Math.min(prev + 1, totalSteps + 1));
  };

  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSpinResult = (discount: number) => {
    setSpinDiscount(discount);
  };

  const submitLead = async (discount: number) => {
    setIsSubmitting(true);
    try {
      const discountedLow = Math.round(estimateLow * (1 - discount / 100));
      const discountedHigh = Math.round(estimateHigh * (1 - discount / 100));

      const { error } = await supabase.from("window_leads").insert([{
        name,
        email,
        phone,
        property_address: address,
        city,
        state: "FL",
        zip_code: zipCode,
        window_selections: windowSelections as any,
        total_windows: windowSelections.reduce((sum, w) => sum + w.quantity, 0),
        performance_level: performanceLevel,
        interior_color: interiorColor,
        exterior_color: exteriorColor,
        glass_type: glassType,
        grid_style: gridStyle,
        existing_window_type: existingWindowType,
        financing_option: financingOption,
        discount_type: discountType,
        estimate_low: estimateLow,
        estimate_high: estimateHigh,
        discount_percent: discount,
        discounted_price: discountedLow,
        spin_result: `${discount}% off`,
        status: "new"
      }]);

      if (error) throw error;
      setShowThankYou(true);
      toast.success("Quote submitted successfully!");
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast.error("Failed to submit quote. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showThankYou) {
    return <WindowThankYouScreen 
      name={name} 
      discount={spinDiscount || 0} 
      estimateLow={estimateLow}
      estimateHigh={estimateHigh}
    />;
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Select Window Types</h3>
              <p className="text-muted-foreground">Choose all the window types you need (select multiple)</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {WINDOW_TYPES.map(type => (
                <Card 
                  key={type.id}
                  className={`cursor-pointer transition-all overflow-hidden ${
                    selectedTypes.includes(type.id) 
                      ? "border-emerald-500 bg-emerald-50 shadow-md ring-2 ring-emerald-500" 
                      : "hover:border-emerald-300 hover:shadow-md"
                  }`}
                  onClick={() => handleTypeToggle(type.id)}
                >
                  <div className="aspect-square relative bg-gradient-to-br from-gray-50 to-gray-100">
                    <img 
                      src={WINDOW_IMAGES[type.image]} 
                      alt={type.name}
                      className="w-full h-full object-contain p-4"
                    />
                    {selectedTypes.includes(type.id) && (
                      <div className="absolute top-2 right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Check className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={selectedTypes.includes(type.id)} className="hidden" />
                      <div>
                        <div className="font-semibold text-lg">{type.name}</div>
                        <div className="text-sm text-muted-foreground">{type.description}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Enter Quantities & Sizes</h3>
              <p className="text-muted-foreground">Specify the size and quantity for each window type</p>
            </div>
            <div className="space-y-4">
              {windowSelections.map(selection => {
                const typeInfo = WINDOW_TYPES.find(t => t.id === selection.type);
                const sizes = getSizeOptions(selection.type);
                return (
                  <Card key={selection.type}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <img 
                            src={WINDOW_IMAGES[typeInfo?.image || ""]} 
                            alt={typeInfo?.name}
                            className="w-16 h-16 object-contain bg-gray-50 rounded-lg p-1"
                          />
                          <Label className="font-semibold">{typeInfo?.name}</Label>
                        </div>
                        <div className="flex-1">
                          <Label className="text-sm text-muted-foreground">Size (WxH)</Label>
                          <Select 
                            value={selection.size} 
                            onValueChange={(v) => updateWindowSelection(selection.type, "size", v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              {sizes.map(size => (
                                <SelectItem key={size} value={size}>{size}"</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-32">
                          <Label className="text-sm text-muted-foreground">Quantity</Label>
                          <Input
                            type="number"
                            min={1}
                            value={selection.quantity}
                            onChange={(e) => updateWindowSelection(selection.type, "quantity", parseInt(e.target.value) || 1)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Do You Qualify for a Discount?</h3>
              <p className="text-muted-foreground">Select any applicable discount programs</p>
            </div>
            <RadioGroup value={discountType} onValueChange={setDiscountType} className="space-y-3">
              {Object.entries(DISCOUNTS).map(([key, { label, value }]) => (
                <div key={key} className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  discountType === key ? "border-emerald-500 bg-emerald-50" : "hover:border-emerald-300"
                }`}>
                  <RadioGroupItem value={key} id={key} />
                  <Label htmlFor={key} className="flex-1 cursor-pointer">
                    {label}
                    {value > 0 && <Badge className="ml-2 bg-emerald-500">{(value * 100)}% Off</Badge>}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Choose Performance Level</h3>
              <p className="text-muted-foreground">Select the grade that fits your needs</p>
            </div>
            <RadioGroup value={performanceLevel} onValueChange={setPerformanceLevel} className="space-y-3">
              {PERFORMANCE_LEVELS.map(level => (
                <div key={level.id} className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  performanceLevel === level.id ? "border-emerald-500 bg-emerald-50" : "hover:border-emerald-300"
                }`}>
                  <RadioGroupItem value={level.id} id={level.id} />
                  <Label htmlFor={level.id} className="flex-1 cursor-pointer">
                    <div className="font-medium">{level.name}</div>
                    <div className="text-sm text-muted-foreground">{level.description}</div>
                  </Label>
                  {level.multiplier > 1 && (
                    <Badge variant="outline">+{((level.multiplier - 1) * 100).toFixed(0)}%</Badge>
                  )}
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Choose Colors</h3>
              <p className="text-muted-foreground">Select interior and exterior frame colors</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <Label className="text-lg font-medium mb-3 block">Interior Color</Label>
                <RadioGroup value={interiorColor} onValueChange={setInteriorColor} className="grid grid-cols-2 gap-2">
                  {COLORS.interior.map(color => (
                    <div key={color} className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${
                      interiorColor === color ? "border-emerald-500 bg-emerald-50" : "hover:border-emerald-300"
                    }`}>
                      <RadioGroupItem value={color} id={`int-${color}`} />
                      <Label htmlFor={`int-${color}`} className="cursor-pointer">{color}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label className="text-lg font-medium mb-3 block">Exterior Color</Label>
                <RadioGroup value={exteriorColor} onValueChange={setExteriorColor} className="grid grid-cols-2 gap-2">
                  {COLORS.exterior.map(color => (
                    <div key={color} className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${
                      exteriorColor === color ? "border-emerald-500 bg-emerald-50" : "hover:border-emerald-300"
                    }`}>
                      <RadioGroupItem value={color} id={`ext-${color}`} />
                      <Label htmlFor={`ext-${color}`} className="cursor-pointer">{color}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Glass & Grid Options</h3>
              <p className="text-muted-foreground">Customize your window appearance and efficiency</p>
            </div>
            <div className="space-y-8">
              <div>
                <Label className="text-lg font-medium mb-3 block">Glass Type</Label>
                <RadioGroup value={glassType} onValueChange={setGlassType} className="space-y-2">
                  {GLASS_TYPES.map(glass => (
                    <div key={glass.id} className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer ${
                      glassType === glass.id ? "border-emerald-500 bg-emerald-50" : "hover:border-emerald-300"
                    }`}>
                      <RadioGroupItem value={glass.id} id={glass.id} />
                      <Label htmlFor={glass.id} className="flex-1 cursor-pointer">{glass.name}</Label>
                      {glass.multiplier > 1 && (
                        <Badge variant="outline">+{((glass.multiplier - 1) * 100).toFixed(0)}%</Badge>
                      )}
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label className="text-lg font-medium mb-3 block">Grid Style</Label>
                <RadioGroup value={gridStyle} onValueChange={setGridStyle} className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {GRID_STYLES.map(style => (
                    <div key={style} className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer ${
                      gridStyle === style ? "border-emerald-500 bg-emerald-50" : "hover:border-emerald-300"
                    }`}>
                      <RadioGroupItem value={style} id={style} />
                      <Label htmlFor={style} className="cursor-pointer">{style}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Your Current Windows</h3>
              <p className="text-muted-foreground">What type of windows do you currently have?</p>
            </div>
            <RadioGroup value={existingWindowType} onValueChange={setExistingWindowType} className="space-y-3">
              {EXISTING_WINDOW_TYPES.map(type => (
                <div key={type} className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer ${
                  existingWindowType === type ? "border-emerald-500 bg-emerald-50" : "hover:border-emerald-300"
                }`}>
                  <RadioGroupItem value={type} id={type} />
                  <Label htmlFor={type} className="cursor-pointer">{type}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Contact Information</h3>
              <p className="text-muted-foreground">We'll send your quote and schedule your free consultation</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="John Smith" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(561) 555-0123" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Property Address *</Label>
                <Input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="West Palm Beach" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input id="zip" value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="33401" />
              </div>
            </div>
            <div>
              <Label className="text-lg font-medium mb-3 block">Financing Preference</Label>
              <RadioGroup value={financingOption} onValueChange={setFinancingOption} className="space-y-2">
                {FINANCING_OPTIONS.map(option => (
                  <div key={option.id} className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer ${
                    financingOption === option.id ? "border-emerald-500 bg-emerald-50" : "hover:border-emerald-300"
                  }`}>
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                      <div className="font-medium">{option.name}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      case 9:
        // If they haven't spun yet, show the spin wheel
        if (!spinDiscount) {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <Badge className="bg-emerald-100 text-emerald-700 mb-4">Almost There!</Badge>
                <h3 className="text-2xl font-bold mb-2">Spin to Reveal Your Quote</h3>
                <p className="text-muted-foreground">
                  Spin the wheel to unlock your exclusive discount and see your final estimate!
                </p>
              </div>
              
              <WindowSpinWheel onResult={handleSpinResult} />
            </div>
          );
        }

        // After spinning, show the discounted quote
        const discountedLow = Math.round(estimateLow * (1 - spinDiscount / 100));
        const discountedHigh = Math.round(estimateHigh * (1 - spinDiscount / 100));
        
        return (
          <div className="space-y-8">
            <div className="text-center">
              <Badge className="bg-emerald-100 text-emerald-700 mb-4">🎉 Congratulations!</Badge>
              <h3 className="text-2xl font-bold mb-2">Your Exclusive Quote</h3>
              <p className="text-muted-foreground">You won {spinDiscount}% OFF your window installation!</p>
            </div>
            
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <CardContent className="p-8 text-center space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Original Estimate</div>
                  <div className="text-xl text-muted-foreground line-through">
                    ${estimateLow.toLocaleString()} - ${estimateHigh.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-emerald-700 mb-1">With {spinDiscount}% Discount</div>
                  <div className="text-4xl md:text-5xl font-bold text-emerald-700">
                    ${discountedLow.toLocaleString()} - ${discountedHigh.toLocaleString()}
                  </div>
                </div>
                <div className="text-sm text-emerald-600">
                  {windowSelections.reduce((sum, w) => sum + w.quantity, 0)} windows • Fully Installed
                </div>
                <Badge className="bg-amber-100 text-amber-800 text-lg px-4 py-2">
                  You Save: ${(estimateLow - discountedLow).toLocaleString()} - ${(estimateHigh - discountedHigh).toLocaleString()}
                </Badge>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-8"
                onClick={() => submitLead(spinDiscount)}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Claim My Discount & Schedule Consultation"}
              </Button>
              <p className="text-sm text-muted-foreground mt-3">
                A window specialist will contact you within 24 hours
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section id="quote" className="py-20 bg-white">
      <div className="container max-w-4xl">
        <Card className="shadow-xl border-2">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-t-lg">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline" className="border-white/50 text-white">
                Step {Math.min(step, totalSteps)} of {totalSteps}
              </Badge>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                <span className="font-semibold">Instant Quote Calculator</span>
              </div>
            </div>
            <Progress value={progress} className="h-2 bg-white/20" />
          </CardHeader>
          
          <CardContent className="p-8">
            {renderStep()}
            
            {step <= totalSteps && !spinDiscount && (
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={step === 1}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  {step === totalSteps ? "Get My Quote" : "Next"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
