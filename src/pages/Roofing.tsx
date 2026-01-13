import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Home, ArrowDown, Sparkles, ArrowLeft, Building2 } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import gcnLogo from "@/assets/gcn-logo.jpg";
import { AIRoofingChat } from "@/components/roofing/AIRoofingChat";
import { PackageBrowser, RoofingPackage } from "@/components/roofing/PackageBrowser";
import { ComparisonBar } from "@/components/roofing/ComparisonBar";
import { PackageComparisonDialog } from "@/components/roofing/PackageComparisonDialog";
import { InstantEstimateFlow } from "@/components/roofing/InstantEstimateFlow";
import { EnhancedQuizFlow } from "@/components/roofing/EnhancedQuizFlow";
import { RoofingProductsGuide } from "@/components/roofing/RoofingProductsGuide";
import { FinancingCalculator } from "@/components/roofing/FinancingCalculator";
import { RoofColorVisualizer } from "@/components/roofing/RoofColorVisualizer";
import { WarrantyComparison } from "@/components/roofing/WarrantyComparison";
import { ReferralSourceSelect } from "@/components/forms/ReferralSourceSelect";
import { RepairLeadForm } from "@/components/roofing/RepairLeadForm";

// Note: pricePerSquare is kept empty to hide from UI, but backend calculations use packagePricing.ts
const roofingPackages: RoofingPackage[] = [
  {
    name: "Bronze Roof Package",
    pricePerSquare: "", // Hidden from UI
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
    pricePerSquare: "", // Hidden from UI
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
    pricePerSquare: "", // Hidden from UI
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
    pricePerSquare: "", // Hidden from UI
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
    pricePerSquare: "", // Hidden from UI
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
    pricePerSquare: "", // Hidden from UI
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
    pricePerSquare: "", // Hidden from UI
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
    pricePerSquare: "", // Hidden from UI
    features: [
      "Tile removal and replacement with premium materials",
      "Polyglass TU MAX underlayment",
      "Glued and screwed for extra durability",
      "Upgraded ventilation system",
      "Includes 6 sheets of plywood and 30 linear feet of fascia"
    ]
  },
  // Roof Refresh removed per Phase 1 plan
  {
    name: "Ultimate Roof Package",
    pricePerSquare: "", // Hidden from UI
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const serviceType = searchParams.get('type'); // 'repair' or 'reroof'
  const propertyType = searchParams.get('propertyType'); // 'commercial' or 'residential'

  // If repair type, show simplified lead form instead of package browser
  if (serviceType === 'repair') {
    return (
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/roofing-services')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Roofing Services
              </Button>
              <Link to="/roofing" className="flex items-center gap-3">
                <img src={gcnLogo} alt="GCN Logo" className="h-10 w-auto" />
                <div className="flex flex-col">
                  <span className="text-lg font-bold">Global Contractor Network</span>
                  <span className="text-xs text-muted-foreground">Roof Repair Request</span>
                </div>
              </Link>
            </div>
          </div>
        </header>

        <section className="py-16">
          <div className="container">
            <RepairLeadForm propertyType={propertyType} />
          </div>
        </section>

        <footer className="border-t py-8 bg-muted/30">
          <div className="container text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 Global Contractor Network. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    );
  }
  
  // Flow state
  const [selectedPackage, setSelectedPackage] = useState<RoofingPackage | null>(null);
  const [comparisonPackages, setComparisonPackages] = useState<RoofingPackage[]>([]);
  const [measurements, setMeasurements] = useState<any>(null);
  
  // Dialog states
  const [estimateFlowOpen, setEstimateFlowOpen] = useState(false);
  const [materialQuizOpen, setMaterialQuizOpen] = useState(false);
  const [comparisonDialogOpen, setComparisonDialogOpen] = useState(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Quote form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    property_address: "",
    message: ""
  });
  const [referralSource, setReferralSource] = useState("");
  const [referralContractorId, setReferralContractorId] = useState<string | null>(null);
  const [pendingQuote, setPendingQuote] = useState<{
    package: RoofingPackage;
    estimate: any;
  } | null>(null);

  // Handle package selection for instant estimate
  const handleSelectPackage = (pkg: RoofingPackage) => {
    setSelectedPackage(pkg);
    setEstimateFlowOpen(true);
  };

  // Handle comparison toggle
  const handleToggleComparison = (pkg: RoofingPackage) => {
    setComparisonPackages(prev => {
      const exists = prev.some(p => p.name === pkg.name);
      if (exists) {
        return prev.filter(p => p.name !== pkg.name);
      }
      if (prev.length >= 3) {
        toast.error("You can only compare up to 3 packages");
        return prev;
      }
      return [...prev, pkg];
    });
  };

  // Handle request quote from estimate flow
  const handleRequestQuote = (pkg: RoofingPackage, estimate: any) => {
    setPendingQuote({ package: pkg, estimate });
    setFormData({
      name: "",
      email: "",
      phone: "",
      property_address: estimate.address || "",
      message: `Package: ${pkg.name}\nRoof Size: ${estimate.totalSquares?.toFixed(1) || "N/A"} squares\nEstimate: $${estimate.estimateLow?.toLocaleString()} - $${estimate.estimateHigh?.toLocaleString()}`
    });
    setEstimateFlowOpen(false);
    setMaterialQuizOpen(false);
    setQuoteDialogOpen(true);
  };

  // Handle quiz package selection
  const handleQuizSelectPackage = (pkg: RoofingPackage, estimate: any) => {
    handleRequestQuote(pkg, estimate);
  };

  // Submit quote request
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
            message: formData.message,
            referral_source: referralSource || null,
            referral_contractor_id: referralContractorId || null,
          }
        ]);

      if (error) throw error;

      // Send Telegram notification
      supabase.functions.invoke('telegram-lead-alert', {
        body: {
          source: '🏠 Roofing Services',
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.property_address,
          service: pendingQuote?.package.name || 'Roofing',
          urgency: 'quote-request',
          estimateLow: pendingQuote?.estimate.estimateLow,
          estimateHigh: pendingQuote?.estimate.estimateHigh,
          notes: formData.message
        }
      }).catch(err => console.error('Telegram notification failed:', err));

      // Notify contractor of new referral if applicable
      if (referralContractorId) {
        supabase.functions.invoke('notify-contractor-referral', {
          body: {
            contractorId: referralContractorId,
            leadName: formData.name,
            leadEmail: formData.email,
            leadPhone: formData.phone,
            serviceType: pendingQuote?.package.name || 'Roofing',
            propertyAddress: formData.property_address,
            leadSource: 'Roofing Services'
          }
        }).catch(err => console.error('Referral notification failed:', err));
      }

      toast.success("Request submitted! We'll contact you soon.");
      setQuoteDialogOpen(false);
      setPendingQuote(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        property_address: "",
        message: ""
      });
      setReferralSource("");
      setReferralContractorId(null);
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToPackages = () => {
    document.getElementById('packages-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/roofing-services')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Services
            </Button>
            <Link to="/roofing" className="flex items-center gap-3">
              <img src={gcnLogo} alt="GCN Logo" className="h-10 w-auto" />
              <div className="flex flex-col">
                <span className="text-lg font-bold">Global Contractor Network</span>
                <span className="text-xs text-muted-foreground">Building Better Together</span>
              </div>
            </Link>
          </div>
          
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
        </div>
      </header>

      {/* Hero Section - Updated for quiz-first flow */}
      <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Property Type Badge */}
            {propertyType && (
              <Badge variant="outline" className="text-base px-4 py-2">
                {propertyType === 'commercial' ? <Building2 className="mr-2 h-4 w-4" /> : <Home className="mr-2 h-4 w-4" />}
                {propertyType === 'commercial' ? 'Commercial Property' : 'Residential Property'}
              </Badge>
            )}

            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Explore Our <span className="text-primary">Roofing Packages</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Browse our comprehensive range of roofing solutions and compare features. 
              Take our quick quiz to get your personalized AI-powered estimate with pricing.
            </p>
            
            {/* Material Quiz CTA - Primary action */}
            <Button 
              size="lg" 
              onClick={() => setMaterialQuizOpen(true)}
              className="text-lg px-8 group"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Find Your Perfect Roofing Material
            </Button>
            
            <Button 
              size="lg" 
              onClick={scrollToPackages}
              variant="outline"
              className="text-lg px-8 group"
            >
              Browse & Compare Features
              <ArrowDown className="ml-2 h-5 w-5 group-hover:translate-y-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Package Browser Section */}
      <section id="packages-section" className="py-16">
        <div className="container">
          <PackageBrowser
            packages={roofingPackages}
            comparisonPackages={comparisonPackages}
            onSelectPackage={handleSelectPackage}
            onToggleComparison={handleToggleComparison}
            onStartQuiz={() => setMaterialQuizOpen(true)}
          />
        </div>
      </section>

      {/* Comparison Bar */}
      <ComparisonBar
        packages={comparisonPackages}
        onRemove={handleToggleComparison}
        onCompare={() => setComparisonDialogOpen(true)}
        onClear={() => setComparisonPackages([])}
      />

      {/* Comparison Dialog */}
      <PackageComparisonDialog
        open={comparisonDialogOpen}
        onOpenChange={setComparisonDialogOpen}
        packages={comparisonPackages}
        measurements={measurements}
        onSelectPackage={handleSelectPackage}
      />

      {/* Instant Estimate Flow */}
      <InstantEstimateFlow
        open={estimateFlowOpen}
        onOpenChange={setEstimateFlowOpen}
        selectedPackage={selectedPackage}
        onRequestQuote={handleRequestQuote}
        onCompareOthers={() => {
          setEstimateFlowOpen(false);
          scrollToPackages();
        }}
      />

      {/* Enhanced Material Quiz Flow */}
      <EnhancedQuizFlow
        open={materialQuizOpen}
        onOpenChange={setMaterialQuizOpen}
        propertyType={propertyType}
        onComplete={() => setMaterialQuizOpen(false)}
      />

      {/* Quote Request Dialog */}
      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Official Quote</DialogTitle>
            <DialogDescription className="space-y-1">
              {pendingQuote && (
                <>
                  <div>Package: <span className="font-semibold">{pendingQuote.package.name}</span></div>
                  <div>Estimated: <span className="font-semibold text-primary">
                    ${pendingQuote.estimate.estimateLow?.toLocaleString()} - ${pendingQuote.estimate.estimateHigh?.toLocaleString()}
                  </span></div>
                </>
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
            <ReferralSourceSelect
              referralSource={referralSource}
              referralContractorId={referralContractorId}
              onReferralSourceChange={setReferralSource}
              onContractorChange={setReferralContractorId}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setQuoteDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Financing Calculator */}
      <FinancingCalculator />

      {/* Roof Color Visualizer */}
      <RoofColorVisualizer />

      {/* Warranty Comparison */}
      <WarrantyComparison />

      {/* Roofing Products Guide */}
      <RoofingProductsGuide />

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30 mt-16">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Global Contractor Network. All rights reserved.
          </p>
        </div>
      </footer>

      {/* AI Chat Assistant */}
      <AIRoofingChat />
    </div>
  );
};

export default Roofing;
