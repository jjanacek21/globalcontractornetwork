import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Home, Ruler } from "lucide-react";
import { Link } from "react-router-dom";
import gcnLogo from "@/assets/gcn-logo.jpg";
import { RoofMeasurementTool } from "@/components/roofing/RoofMeasurementTool";
import { MeasurementReport } from "@/components/roofing/MeasurementReport";
import { PackageSelector } from "@/components/roofing/PackageSelector";

const roofingPackages = [
  {
    name: "Bronze Roof Package",
    pricePerSquare: "$575-$650",
    features: [
      "Architectural shingles",
      "Synthetic underlayment for enhanced water resistance",
      "Ridge vent system for improved attic ventilation",
      "Includes 3 sheets of plywood and 10 linear feet of fascia replacement",
      "Backed by a 5-year workmanship warranty"
    ]
  },
  {
    name: "Silver Roof Package",
    pricePerSquare: "$700-$725",
    features: [
      "Architectural shingles",
      "Standard peel-and-stick underlayment",
      "Ridge vents or gooseneck vents (with additional vents as needed)",
      "Includes 5 sheets of plywood and 25 linear feet of fascia",
      "Comes with a 10-year workmanship warranty"
    ]
  },
  {
    name: "Gold Roof Package",
    pricePerSquare: "$800-$850",
    features: [
      "Architectural shingles",
      "High-temperature peel-and-stick underlayment for superior protection",
      "Solar attic fan for energy-efficient ventilation",
      "Includes 7 sheets of plywood and 30 linear feet of painted fascia",
      "6-inch seamless gutters with downspouts",
      "Lifetime roof warranty included"
    ]
  },
  {
    name: "The Blue Collar Special",
    pricePerSquare: "$860/sq",
    features: [
      "5V crimp metal roof in mill finish",
      "Polyglass synthetic underlayment",
      "Standard ridge or gooseneck vents",
      "Includes 5 sheets of plywood and 25 linear feet of fascia",
      "Covered by a 10-year workmanship warranty"
    ]
  },
  {
    name: "Blue Collar+",
    pricePerSquare: "$930",
    features: [
      "5V crimp metal roof with Kynar-coated finish",
      "High-temperature Polyglass underlayment",
      "Solar-powered ventilation system",
      "Includes 7 sheets of plywood and 30 linear feet of fascia",
      "Lifetime workmanship warranty"
    ]
  },
  {
    name: "Platinum Roof Package",
    pricePerSquare: "$1,000-$1,200",
    features: [
      "1\" Snap-lock standing seam metal roof (24-gauge, Kynar-coated)",
      "Polyglass MTS high-temp underlayment",
      "Solar attic fan ventilation",
      "Includes 7 sheets of plywood and 30 linear feet of painted fascia",
      "Lifetime roof warranty"
    ]
  },
  {
    name: "Tile Roof Package",
    pricePerSquare: "$900-$1,000",
    features: [
      "Complete removal and replacement of existing tile roof",
      "Standard tile underlayment with screw-down fastening",
      "All accessories matched to existing style",
      "Includes 3 sheets of plywood and 20 linear feet of fascia",
      "10-year workmanship warranty"
    ]
  },
  {
    name: "Tile+ Roof Package",
    pricePerSquare: "$1,000-$1,100",
    features: [
      "Tile removal and replacement with premium materials",
      "Polyglass TU MAX underlayment",
      "Glued and screwed for extra durability",
      "Upgraded ventilation system",
      "Includes 6 sheets of plywood and 30 linear feet of fascia"
    ]
  },
  {
    name: "Roof Refresh",
    pricePerSquare: "TBD",
    features: [
      "Repair broken or damaged tiles and apply matching stain",
      "Recoat metal roofs with acrylic, elastomeric, or Kynar finishes",
      "Apply silicone or acrylic coatings to flat roofs",
      "Surface preparation included for all coatings",
      "5-year workmanship warranty on applicable services"
    ]
  },
  {
    name: "Ultimate Roof Package",
    pricePerSquare: "$1,360-$1,850",
    features: [
      "Premium standing seam metal roof (1.5\" with clips) or stone-coated steel (Tefute/Novatik)",
      "Polyglass XFR high-temp and fire-rated underlayment",
      "Attic Breeze solar-powered ventilation system",
      "Includes 10 sheets of plywood and 30 linear feet of painted fascia",
      "Complete roof-to-wall flashing and stucco refinishing",
      "Lifetime roof warranty"
    ]
  }
];

const Roofing = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showMeasurement, setShowMeasurement] = useState(false);
  const [measurements, setMeasurements] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    property_address: "",
    message: ""
  });

  const handleMeasurementComplete = (measurementData: any) => {
    setMeasurements(measurementData);
    setShowMeasurement(false);
  };

  const handleRequestService = (packageName: string, price: string) => {
    setSelectedPackage(packageName);
    setEstimatedPrice(price);
    setFormData({
      ...formData,
      property_address: measurements?.address || "",
      message: measurements 
        ? `Roof Measurements:\n- Total Squares: ${measurements.totalSquares.toFixed(2)}\n- Flat Area: ${measurements.flatArea.toFixed(0)} sq ft\n- Pitched Area: ${measurements.pitchedArea.toFixed(0)} sq ft\n- Pitch Multiplier: ${measurements.pitchMultiplier}\n- Waste Factor: ${measurements.wasteFactor}%\n\nEstimated Price: ${price}`
        : ""
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("service_requests")
        .insert([
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            property_address: formData.property_address,
            message: `${selectedPackage}\n\n${formData.message}`
          }
        ]);

      if (error) throw error;

      toast.success("Request submitted successfully! We'll contact you soon.");
      setDialogOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        property_address: "",
        message: ""
      });
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={gcnLogo} alt="GCN Logo" className="h-10 w-auto" />
            <div className="flex flex-col">
              <span className="text-lg font-bold">Global Contractor Network</span>
              <span className="text-xs text-muted-foreground">Building Better Together</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex gap-6">
            <Link to="/directory" className="text-sm font-medium hover:text-primary transition-colors">
              Directory
            </Link>
            <Link to="/prep-property" className="text-sm font-medium hover:text-primary transition-colors">
              Services
            </Link>
            <Link to="/store" className="text-sm font-medium hover:text-primary transition-colors">
              Store
            </Link>
            <Link to="/blog" className="text-sm font-medium hover:text-primary transition-colors">
              Blog
            </Link>
          </nav>

          <Button asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Professional <span className="text-primary">Roofing Services</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Get your free roof measurement and choose from our comprehensive range of roofing packages
            </p>
            <Button 
              size="lg" 
              onClick={() => setShowMeasurement(true)}
              className="text-lg px-8"
            >
              <Ruler className="mr-2 h-5 w-5" />
              Get Your Free Roof Measurement
            </Button>
          </div>
        </div>
      </section>

      {/* Measurement Tool Section */}
      {showMeasurement && !measurements && (
        <section className="py-20 bg-muted/30">
          <div className="container max-w-5xl">
            <RoofMeasurementTool onMeasurementComplete={handleMeasurementComplete} />
          </div>
        </section>
      )}

      {/* Measurement Report Section */}
      {measurements && (
        <section className="py-20 bg-muted/30">
          <div className="container max-w-4xl space-y-8">
            <MeasurementReport measurements={measurements} />
            <Button 
              variant="outline" 
              onClick={() => {
                setMeasurements(null);
                setShowMeasurement(true);
              }}
              className="w-full"
            >
              Take New Measurement
            </Button>
          </div>
        </section>
      )}

      {/* Roofing Packages */}
      <section className="py-20">
        <div className="container">
          {measurements ? (
            <PackageSelector 
              packages={roofingPackages}
              totalSquares={measurements.totalSquares}
              onSelectPackage={handleRequestService}
            />
          ) : (
            <>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Roofing Packages</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  From budget-friendly solutions to premium installations, we have a package for every need and budget
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roofingPackages.map((pkg) => (
                  <Card key={pkg.name} className="shadow-card hover:shadow-elevated transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{pkg.name}</span>
                      </CardTitle>
                      <CardDescription className="text-2xl font-bold text-primary">
                        {pkg.pricePerSquare}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button 
                        onClick={() => handleRequestService(pkg.name, pkg.pricePerSquare)}
                        className="w-full"
                      >
                        Request Quote
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Quote</DialogTitle>
            <DialogDescription className="space-y-1">
              <div>Package: <span className="font-semibold">{selectedPackage}</span></div>
              {estimatedPrice && (
                <div>Estimated Price: <span className="font-semibold text-primary">{estimatedPrice}</span></div>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="address">Property Address</Label>
              <Input
                id="address"
                value={formData.property_address}
                onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="message">Additional Details</Label>
              <Textarea
                id="message"
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Global Contractor Network. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Roofing;