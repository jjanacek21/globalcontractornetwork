import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Home,
  Building2,
  Shield,
  Users,
  ArrowRight,
  CheckCircle2,
  Star,
  Phone,
  Zap,
  Trees,
  Droplets,
  Wind,
  PanelTop,
  Wrench,
  Calendar,
  Video,
  ClipboardCheck,
  Crown,
  FileText,
  DollarSign,
  GraduationCap,
  ShoppingBag,
  Bot,
  Megaphone,
  Handshake,
  LayoutDashboard,
  Search,
  Award,
  Headphones,
  Globe,
  Sparkles,
  Hammer,
  HardHat,
  Ruler,
  ClipboardList
} from "lucide-react";
import gcnLogo from "@/assets/gcn-logo.jpg";

const Index = () => {
  const navigate = useNavigate();

  const homeownerServices = [
    { icon: Home, title: "Roofing", description: "Full replacements, repairs, and inspections", link: "/roofing" },
    { icon: Shield, title: "Roof Coatings", description: "Extend your roof's life by 15+ years", link: "/coating-kings" },
    { icon: PanelTop, title: "Windows & Doors", description: "Impact-rated installations", link: "/green-home-solutions" },
    { icon: Trees, title: "Tree & Landscaping", description: "Removal, trimming, and design", link: "/northern-landscaping" },
    { icon: Droplets, title: "Mold & Emergency", description: "24/7 water damage & remediation", link: "/emergency-mitigation" },
    { icon: Wind, title: "Siding", description: "Vinyl, fiber cement, and more", link: "/prep-property" },
    { icon: PanelTop, title: "Gutters", description: "Seamless gutters and guards", link: "/prep-property" },
    { icon: Wrench, title: "General Repairs", description: "Handyman and maintenance", link: "/prep-property" },
    { icon: Calendar, title: "Maintenance Plans", description: "Annual property protection", link: "/prep-property" },
  ];

  const contractorFeatures = [
    { icon: Search, title: "Directory Listings", description: "Get found by local property owners", link: "/directory" },
    { icon: Crown, title: "Permit Marketplace", description: "Qualifiers & expediters on demand", link: "/permit-queens" },
    { icon: DollarSign, title: "Supplement Support", description: "Xactimate-ready claim maximization", link: "/supplement-kings" },
    { icon: LayoutDashboard, title: "CRM & Lead Manager", description: "Track leads, jobs, and revenue", link: "/contractor" },
    { icon: GraduationCap, title: "Training Library", description: "Certifications and skill courses", link: "/learning" },
    { icon: ShoppingBag, title: "Equipment Store", description: "Tools, merch, and supplies", link: "/store" },
    { icon: Bot, title: "AI Assistant", description: "White-label virtual contractor", link: "/roofing" },
    { icon: Users, title: "Subcontractor Hub", description: "Find and vet subs fast", link: "/directory" },
    { icon: Megaphone, title: "Marketing Services", description: "Web design, SEO, and ads", link: "/digital-marketing" },
  ];

  const growthPillars = [
    { icon: LayoutDashboard, title: "CRM & Lead Manager", description: "All-in-one pipeline and project tracking" },
    { icon: Crown, title: "Permit Qualifier Marketplace", description: "Connect with licensed qualifiers instantly" },
    { icon: DollarSign, title: "Estimating & Supplements", description: "Xactimate experts to maximize claims" },
    { icon: Megaphone, title: "Marketing & Web Design", description: "Full-service digital growth solutions" },
  ];

  const whyChooseItems = [
    { icon: Zap, text: "Instant quotes" },
    { icon: Video, text: "Virtual contractor help" },
    { icon: Shield, text: "Verified pros" },
    { icon: Calendar, text: "Maintenance memberships" },
    { icon: LayoutDashboard, text: "CRM & business tools" },
    { icon: Globe, text: "National directory" },
    { icon: Bot, text: "AI-powered support" },
    { icon: FileText, text: "Permit qualifying" },
  ];

  const testimonials = [
    { name: "Sarah M.", location: "Miami, FL", text: "Got 3 quotes in under an hour. My new roof looks amazing!", rating: 5 },
    { name: "James R.", location: "Tampa, FL", text: "The virtual consultation saved me so much time. Highly recommend!", rating: 5 },
    { name: "Maria L.", location: "Orlando, FL", text: "Finally found a contractor I can trust. The verification process gave me peace of mind.", rating: 5 },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full bg-[hsl(0,0%,5%)] backdrop-blur-lg border-b border-white/10">
        <div className="container flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={gcnLogo} alt="GCN Logo" className="h-12 w-auto rounded-lg" />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white">Global Contractor Network</span>
              <span className="text-xs text-white/60">One Platform. Every Need.</span>
            </div>
          </Link>
          
          <nav className="hidden lg:flex gap-8">
            <Link to="/roofing" className="text-sm font-medium text-white/80 hover:text-[hsl(45,90%,55%)] transition-colors">
              Services
            </Link>
            <Link to="/directory" className="text-sm font-medium text-white/80 hover:text-[hsl(45,90%,55%)] transition-colors">
              Directory
            </Link>
            <Link to="/contractor" className="text-sm font-medium text-white/80 hover:text-[hsl(45,90%,55%)] transition-colors">
              For Contractors
            </Link>
            <Link to="/store" className="text-sm font-medium text-white/80 hover:text-[hsl(45,90%,55%)] transition-colors">
              Store
            </Link>
            <Link to="/blog" className="text-sm font-medium text-white/80 hover:text-[hsl(45,90%,55%)] transition-colors">
              Blog
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="text-white hover:text-[hsl(45,90%,55%)] hover:bg-white/10">
              <Link to="/contractor">Sign In</Link>
            </Button>
            <Button asChild className="btn-gold px-6">
              <Link to="/join">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-gradient-bg min-h-[90vh] flex items-center relative">
        {/* Floating Home Icons - Left Side (Homeowners) */}
        <Home className="floating-icon floating-icon-home float-slow float-delay-1 h-12 w-12" style={{ top: '15%', left: '5%' }} />
        <PanelTop className="floating-icon floating-icon-home float-medium float-delay-2 h-10 w-10" style={{ top: '35%', left: '12%' }} />
        <Trees className="floating-icon floating-icon-home float-fast float-delay-3 h-14 w-14" style={{ top: '55%', left: '3%' }} />
        <Shield className="floating-icon floating-icon-home float-slow float-delay-4 h-8 w-8" style={{ top: '70%', left: '15%' }} />
        <Droplets className="floating-icon floating-icon-home float-medium float-delay-5 h-10 w-10" style={{ top: '25%', left: '18%' }} />
        <Home className="floating-icon floating-icon-home float-drift float-delay-6 h-6 w-6" style={{ top: '85%', left: '8%' }} />
        
        {/* Floating Tool Icons - Right Side (Contractors) */}
        <Wrench className="floating-icon floating-icon-tool float-slow float-delay-1 h-12 w-12" style={{ top: '18%', right: '6%' }} />
        <Hammer className="floating-icon floating-icon-tool float-medium float-delay-2 h-10 w-10" style={{ top: '40%', right: '4%' }} />
        <HardHat className="floating-icon floating-icon-tool float-fast float-delay-3 h-14 w-14" style={{ top: '60%', right: '12%' }} />
        <DollarSign className="floating-icon floating-icon-tool float-slow float-delay-4 h-8 w-8" style={{ top: '30%', right: '16%' }} />
        <Ruler className="floating-icon floating-icon-tool float-medium float-delay-5 h-10 w-10" style={{ top: '75%', right: '5%' }} />
        <ClipboardList className="floating-icon floating-icon-tool float-drift float-delay-6 h-6 w-6" style={{ top: '48%', right: '18%' }} />
        
        <div className="gold-orb gold-orb-1" />
        <div className="gold-orb gold-orb-2" />
        <div className="container relative z-10 py-20">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            {/* Trust Badge */}
            <div className="trust-badge mx-auto animate-hero-text">
              <CheckCircle2 className="h-4 w-4 text-[hsl(45,90%,55%)]" />
              <span>Trusted by 10,000+ contractors and homeowners nationwide</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white animate-hero-text-delay-1">
              One Platform for All Your{" "}
              <span className="text-[hsl(45,90%,55%)]">Contractor Needs</span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto animate-hero-text-delay-2">
              Everything you need to hire, manage, or grow a contractor business — all in one place.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-hero-text-delay-3">
              <Button 
                size="lg" 
                className="btn-outline-white px-8 py-6 text-lg"
                onClick={() => navigate('/roofing')}
              >
                I'm a Homeowner
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                className="btn-gold px-8 py-6 text-lg"
                onClick={() => navigate('/join')}
              >
                I'm a Contractor
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Secondary CTA */}
            <div className="pt-4 animate-hero-text-delay-3">
              <Link 
                to="/roofing" 
                className="text-white/60 hover:text-[hsl(45,90%,55%)] transition-colors inline-flex items-center gap-2 text-sm"
              >
                <Phone className="h-4 w-4" />
                Schedule a Free Consultation
              </Link>
            </div>

            {/* Trust Indicators Row */}
            <div className="flex flex-wrap justify-center gap-6 pt-8 animate-hero-text-delay-3">
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Shield className="h-4 w-4 text-[hsl(45,90%,55%)]" />
                Verified Pros
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Headphones className="h-4 w-4 text-[hsl(45,90%,55%)]" />
                24/7 Support
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Zap className="h-4 w-4 text-[hsl(45,90%,55%)]" />
                Instant Quotes
              </div>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Award className="h-4 w-4 text-[hsl(45,90%,55%)]" />
                Licensed & Insured
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Homeowner Section */}
      <section className="py-24 bg-[hsl(0,0%,98%)]">
        <div className="container">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(45,90%,55%)]/10 rounded-full text-[hsl(40,90%,40%)] text-sm font-medium mb-4">
              <Home className="h-4 w-4" />
              For Homeowners & Property Owners
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-[hsl(0,0%,10%)] mb-4">
              Fast Service. Fair Pricing. Verified Pros.
            </h2>
            <p className="text-xl text-[hsl(0,0%,40%)] max-w-2xl mx-auto">
              Instant quotes, virtual contractor consultations, fast repairs, and verified professionals.
            </p>
          </div>

          {/* 3-Step Process */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {[
              { num: 1, title: "Tell Us What You Need", desc: "Describe your project or choose from our services" },
              { num: 2, title: "Get Instant Pricing", desc: "Receive competitive quotes in minutes, not days" },
              { num: 3, title: "Schedule Service", desc: "Book an inspection or start your project" },
            ].map((step) => (
              <div key={step.num} className="process-step">
                <div className="process-step-number">{step.num}</div>
                <h3 className="text-xl font-bold text-[hsl(0,0%,10%)] mb-2">{step.title}</h3>
                <p className="text-[hsl(0,0%,40%)]">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Service Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {homeownerServices.map((service, index) => (
              <Link 
                key={service.title}
                to={service.link}
                className="premium-card group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="icon-container-gold mb-4">
                  <service.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[hsl(0,0%,10%)] mb-2 group-hover:text-[hsl(40,90%,40%)] transition-colors">
                  {service.title}
                </h3>
                <p className="text-[hsl(0,0%,50%)] text-sm mb-4">{service.description}</p>
                <div className="flex items-center text-[hsl(45,90%,45%)] text-sm font-medium">
                  Learn more
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          {/* Homeowner CTAs */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="btn-gold" onClick={() => navigate('/roofing')}>
              Get an Instant Quote
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-[hsl(0,0%,20%)] hover:bg-[hsl(0,0%,95%)]" onClick={() => navigate('/roofing')}>
              <Video className="mr-2 h-5 w-5" />
              Book Virtual Consultation
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-[hsl(0,0%,20%)] hover:bg-[hsl(0,0%,95%)]" onClick={() => navigate('/prep-property')}>
              <ClipboardCheck className="mr-2 h-5 w-5" />
              Schedule Inspection
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-[hsl(0,0%,20%)] hover:bg-[hsl(0,0%,95%)]" onClick={() => navigate('/prep-property')}>
              <Calendar className="mr-2 h-5 w-5" />
              Join Maintenance Plan
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container">
          <h3 className="text-2xl font-bold text-center text-[hsl(0,0%,10%)] mb-12">What Homeowners Say</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="testimonial-card">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-[hsl(45,90%,55%)] text-[hsl(45,90%,55%)]" />
                  ))}
                </div>
                <p className="text-[hsl(0,0%,30%)] mb-4 italic">"{testimonial.text}"</p>
                <div className="text-sm">
                  <span className="font-semibold text-[hsl(0,0%,10%)]">{testimonial.name}</span>
                  <span className="text-[hsl(0,0%,50%)]"> — {testimonial.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gold Divider */}
      <div className="section-divider-gold" />

      {/* Contractor Section */}
      <section className="dark-section-contractor py-24 relative">
        <div className="grid-pattern-dark absolute inset-0" />
        <div className="container relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(45,90%,55%)]/20 rounded-full text-[hsl(45,90%,55%)] text-sm font-medium mb-4">
              <Building2 className="h-4 w-4" />
              For Contractors & Service Providers
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Grow Your Business with the <span className="text-[hsl(45,90%,55%)]">#1 Platform</span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Tools, support, and opportunities to scale your contracting business.
            </p>
          </div>

          {/* 4 Growth Pillars */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {growthPillars.map((pillar) => (
              <div key={pillar.title} className="premium-card-dark text-center">
                <div className="icon-container-gold mx-auto mb-4">
                  <pillar.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{pillar.title}</h3>
                <p className="text-white/50 text-sm">{pillar.description}</p>
              </div>
            ))}
          </div>

          {/* Feature Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {contractorFeatures.map((feature) => (
              <Link 
                key={feature.title}
                to={feature.link}
                className="premium-card-dark group"
              >
                <div className="icon-container-gold mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[hsl(45,90%,55%)] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-white/50 text-sm mb-4">{feature.description}</p>
                <div className="flex items-center text-[hsl(45,90%,55%)] text-sm font-medium">
                  Explore
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          {/* Contractor CTAs */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="btn-gold" onClick={() => navigate('/join')}>
              Join the Contractor Network
            </Button>
            <Button size="lg" className="btn-outline-white" onClick={() => navigate('/directory')}>
              Get Listed in Directory
            </Button>
            <Button size="lg" className="btn-outline-white" onClick={() => navigate('/contractor')}>
              Access the CRM
            </Button>
            <Button size="lg" className="btn-outline-white" onClick={() => navigate('/permit-queens')}>
              Become a Qualified Partner
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose GCN */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[hsl(0,0%,10%)] mb-4">
              Why Choose Global Contractor Network?
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {whyChooseItems.map((item) => (
              <div key={item.text} className="why-badge">
                <div className="why-badge-icon">
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="text-[hsl(0,0%,20%)] font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Split CTA Section */}
      <section className="grid md:grid-cols-2">
        <div className="split-cta-homeowner p-12 md:p-20 flex flex-col justify-center items-center text-center">
          <Home className="h-12 w-12 text-[hsl(0,0%,20%)] mb-6" />
          <h3 className="text-2xl md:text-3xl font-bold text-[hsl(0,0%,10%)] mb-4">I'm a Homeowner</h3>
          <p className="text-[hsl(0,0%,40%)] mb-6 max-w-sm">
            Get instant quotes, virtual consultations, and connect with verified contractors.
          </p>
          <Button size="lg" className="btn-gold" onClick={() => navigate('/roofing')}>
            Find a Contractor
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
        <div className="split-cta-contractor p-12 md:p-20 flex flex-col justify-center items-center text-center">
          <Handshake className="h-12 w-12 text-[hsl(45,90%,55%)] mb-6" />
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">I'm a Contractor</h3>
          <p className="text-white/60 mb-6 max-w-sm">
            Access CRM tools, get listed in the directory, and grow your business.
          </p>
          <Button size="lg" className="btn-gold" onClick={() => navigate('/join')}>
            Join the Network
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[hsl(0,0%,8%)] py-16">
        <div className="container">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            {/* Logo & Tagline */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src={gcnLogo} alt="GCN Logo" className="h-12 w-auto rounded-lg" />
                <span className="text-xl font-bold text-white">Global Contractor Network</span>
              </div>
              <p className="text-white/50 text-sm max-w-xs">
                One platform for all your contractor needs. Hire, manage, or grow — we've got you covered.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-white/50">
                <li><Link to="/blog" className="hover:text-[hsl(45,90%,55%)] transition-colors">About</Link></li>
                <li><Link to="/blog" className="hover:text-[hsl(45,90%,55%)] transition-colors">Blog</Link></li>
                <li><Link to="/franchise" className="hover:text-[hsl(45,90%,55%)] transition-colors">Franchise</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-3 text-sm text-white/50">
                <li><Link to="/blog" className="hover:text-[hsl(45,90%,55%)] transition-colors">FAQs</Link></li>
                <li><Link to="/blog" className="hover:text-[hsl(45,90%,55%)] transition-colors">Contact</Link></li>
                <li><Link to="/blog" className="hover:text-[hsl(45,90%,55%)] transition-colors">Terms</Link></li>
                <li><Link to="/blog" className="hover:text-[hsl(45,90%,55%)] transition-colors">Privacy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Access</h4>
              <ul className="space-y-3 text-sm text-white/50">
                <li><Link to="/contractor" className="hover:text-[hsl(45,90%,55%)] transition-colors">Contractor Sign In</Link></li>
                <li><Link to="/join" className="hover:text-[hsl(45,90%,55%)] transition-colors">Join Network</Link></li>
                <li><Link to="/directory" className="hover:text-[hsl(45,90%,55%)] transition-colors">Directory</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-center text-sm text-white/40">
            © 2025 Global Contractor Network. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
