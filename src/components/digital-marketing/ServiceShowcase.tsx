import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, 
  Settings, 
  Mail, 
  Palette, 
  Check,
  ArrowRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";

const websiteFeatures = [
  "Discovery & Strategic Planning",
  "Custom UI/UX Design",
  "Content Creation + Basic SEO",
  "Lead Capture & Conversion Elements",
  "CRM & Tool Integrations",
  "7-Step Launch Optimization",
  "Post-Launch Support & Training"
];

const crmFeatures = [
  "Custom Landing Page Setup",
  "Lead Form & Automation Workflows",
  "Pipeline Build-Out & Configuration",
  "SMS Drip Sequences",
  "Email Workflow Automation",
  "Follow-Up Sequences",
  "Automatic Review Requests",
  "Lead Notification System",
  "Training Sessions Included"
];

const emailSmsFeatures = [
  "Segmented Campaign Setup",
  "Professional Copywriting",
  "Full Automation Configuration",
  "Compliance Optimized (CAN-SPAM, TCPA)",
  "Performance Analysis & Optimization"
];

const designFeatures = [
  "5–10 Custom Designs/Month",
  "Posters, Flyers, Thumbnails, Ads",
  "1 Revision Included Per Design",
  "Additional Designs: +$100 each",
  "Fast Turnaround Times"
];

export function ServiceShowcase() {
  const scrollToForm = () => {
    document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 mb-4">
            Detailed Services
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
            Explore Our Core Services
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Dive deep into each service offering and see exactly what you get.
          </p>
        </div>

        <Tabs defaultValue="website" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2 bg-transparent h-auto p-0 mb-8">
            <TabsTrigger 
              value="website" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-white border border-slate-200 rounded-lg py-3 px-4 flex items-center gap-2"
            >
              <Globe className="h-4 w-4" />
              Website Design
            </TabsTrigger>
            <TabsTrigger 
              value="crm" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-white border border-slate-200 rounded-lg py-3 px-4 flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              CRM Setup
            </TabsTrigger>
            <TabsTrigger 
              value="email" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-white border border-slate-200 rounded-lg py-3 px-4 flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Email/SMS Drips
            </TabsTrigger>
            <TabsTrigger 
              value="design" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-white border border-slate-200 rounded-lg py-3 px-4 flex items-center gap-2"
            >
              <Palette className="h-4 w-4" />
              Design on Demand
            </TabsTrigger>
          </TabsList>

          <TabsContent value="website" className="mt-0">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-lg">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Globe className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">Website Design & Development</h3>
                      <p className="text-slate-500">Conversion-focused websites that generate leads</p>
                    </div>
                  </div>
                  <p className="text-slate-600 mb-6">
                    We build high-converting websites specifically designed for contractors and service businesses. 
                    From discovery to launch, we handle everything so you can focus on your business.
                  </p>
                  <ul className="space-y-3">
                    {websiteFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button onClick={scrollToForm} className="mt-6 bg-blue-600 hover:bg-blue-700">
                    Get Website Quote <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="lg:w-80 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
                  <p className="text-sm text-blue-600 font-medium mb-2">Starting at</p>
                  <p className="text-4xl font-bold text-slate-900 mb-4">$2,500</p>
                  <p className="text-sm text-slate-600">Custom quote based on project scope and requirements.</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="crm" className="mt-0">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-lg">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">CRM Setup & Automation</h3>
                      <p className="text-slate-500">Streamline your sales process from lead to close</p>
                    </div>
                  </div>
                  <p className="text-slate-600 mb-6">
                    Stop losing leads to messy spreadsheets. We'll set up a complete CRM system with 
                    automated follow-ups, pipeline management, and everything you need to close more deals.
                  </p>
                  <ul className="space-y-3">
                    {crmFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-purple-500 flex-shrink-0" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button onClick={scrollToForm} className="mt-6 bg-purple-600 hover:bg-purple-700">
                    Get CRM Setup <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="lg:w-80 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <p className="text-sm text-purple-600 font-medium mb-2">Setup Fee</p>
                  <p className="text-4xl font-bold text-slate-900 mb-2">$1,500</p>
                  <p className="text-sm text-slate-600 mb-4">One-time setup and configuration.</p>
                  <div className="border-t border-purple-100 pt-4">
                    <p className="text-sm text-purple-600 font-medium mb-1">Ongoing Management</p>
                    <p className="text-2xl font-bold text-slate-900">$500<span className="text-sm font-normal text-slate-500">/mo</span></p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="email" className="mt-0">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-lg">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">Email & SMS Drip Campaigns</h3>
                      <p className="text-slate-500">Automated nurturing that converts leads to customers</p>
                    </div>
                  </div>
                  <p className="text-slate-600 mb-6">
                    Keep your leads warm with automated email and SMS sequences. From initial contact to 
                    repeat business, we create campaigns that nurture relationships and drive conversions.
                  </p>
                  <ul className="space-y-3">
                    {emailSmsFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button onClick={scrollToForm} className="mt-6 bg-green-600 hover:bg-green-700">
                    Set Up Campaigns <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="lg:w-80 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <p className="text-sm text-green-600 font-medium mb-2">Setup Fee</p>
                  <p className="text-4xl font-bold text-slate-900 mb-4">$500</p>
                  <p className="text-sm text-slate-600">Per campaign sequence setup.</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="design" className="mt-0">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-lg">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                      <Palette className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">Design on Demand</h3>
                      <p className="text-slate-500">Professional graphics whenever you need them</p>
                    </div>
                  </div>
                  <p className="text-slate-600 mb-6">
                    Need a flyer for tomorrow? A new ad creative? Our design team delivers professional 
                    graphics on your schedule. Fast turnaround, quality results.
                  </p>
                  <ul className="space-y-3">
                    {designFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-orange-500 flex-shrink-0" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button onClick={scrollToForm} className="mt-6 bg-orange-600 hover:bg-orange-700">
                    Get Design Help <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="lg:w-80 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100">
                  <p className="text-sm text-orange-600 font-medium mb-2">Monthly Retainer</p>
                  <p className="text-4xl font-bold text-slate-900 mb-4">$500</p>
                  <p className="text-sm text-slate-600">5-10 designs per month included.</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
