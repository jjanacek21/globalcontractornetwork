import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, ArrowRight, CheckCircle2, Users, Home, Shield } from "lucide-react";

const LandingHero = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      navigate(`/join?email=${encodeURIComponent(email)}`);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent" />
      
      {/* Animated Background Elements */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float delay-500" />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8 animate-fade-in-up">
            {/* Rating Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full border border-accent/30">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <span className="text-sm font-medium text-foreground">
                Rated 4.9/5 with 500+ reviews
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              One Platform.{" "}
              <span className="text-primary">All the Tools</span>{" "}
              for Every Contractor Need.
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-muted-foreground max-w-xl">
              Managing leads, estimates, permits, supplements, and payments has never been easier. 
              Join 1,000+ contractors growing their business with GCN.
            </p>

            {/* Email Signup Form */}
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 text-lg px-6 flex-1"
                required
              />
              <Button type="submit" size="lg" className="h-14 px-8 text-lg font-semibold gap-2">
                Start for Free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </form>

            {/* Trust Indicators */}
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Sign up free. No credit card required.
            </p>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-6 pt-4">
              <div className="text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold">1,000+</span>
                </div>
                <p className="text-sm text-muted-foreground">Active Contractors</p>
              </div>
              <div className="text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <Home className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold">50K+</span>
                </div>
                <p className="text-sm text-muted-foreground">Projects Completed</p>
              </div>
              <div className="text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold">$10M+</span>
                </div>
                <p className="text-sm text-muted-foreground">Claims Supplemented</p>
              </div>
            </div>
          </div>

          {/* Right Column - Dashboard Preview */}
          <div className="relative animate-fade-in-right delay-300">
            <div className="relative">
              {/* Dashboard Mockup */}
              <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
                {/* Browser Chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-accent/60" />
                  <div className="w-3 h-3 rounded-full bg-primary/60" />
                  <div className="flex-1 mx-4">
                    <div className="bg-background rounded-md px-4 py-1.5 text-sm text-muted-foreground">
                      app.globalcontractornetwork.com
                    </div>
                  </div>
                </div>

                {/* Dashboard Content Preview */}
                <div className="p-6 space-y-4">
                  {/* Header Bar */}
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-32 bg-primary/20 rounded" />
                    <div className="flex gap-2">
                      <div className="h-8 w-8 bg-muted rounded-full" />
                      <div className="h-8 w-8 bg-muted rounded-full" />
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Active Leads", value: "24", color: "bg-primary/20" },
                      { label: "Pending Estimates", value: "12", color: "bg-accent/20" },
                      { label: "This Month", value: "$48,500", color: "bg-green-500/20" },
                    ].map((stat, i) => (
                      <div key={i} className={`${stat.color} rounded-lg p-4`}>
                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                        <div className="text-lg font-bold">{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Table Preview */}
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-muted rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-32 bg-muted rounded" />
                          <div className="h-2 w-24 bg-muted/60 rounded" />
                        </div>
                        <div className="h-6 w-16 bg-primary/30 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -bottom-4 -left-4 bg-card rounded-xl shadow-lg border border-border p-4 animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">New Lead</p>
                    <p className="text-xs text-muted-foreground">John D. - Roof Replacement</p>
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-card rounded-xl shadow-lg border border-border p-4 animate-float delay-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">5-Star Review</p>
                    <p className="text-xs text-muted-foreground">"Excellent service!"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
