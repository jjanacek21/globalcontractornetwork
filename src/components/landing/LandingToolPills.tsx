import { 
  LayoutDashboard, 
  Calculator, 
  FileText, 
  Package, 
  Receipt, 
  CreditCard, 
  Calendar,
  Ruler
} from "lucide-react";

const tools = [
  { name: "GCN CRM", icon: LayoutDashboard },
  { name: "Instant Estimator", icon: Calculator },
  { name: "Measurement Reports", icon: Ruler },
  { name: "Proposals", icon: FileText },
  { name: "Material Ordering", icon: Package },
  { name: "Invoicing", icon: Receipt },
  { name: "Payments", icon: CreditCard },
  { name: "Calendar", icon: Calendar },
];

const LandingToolPills = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            Your Complete Toolkit
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4">
            Tools Proven to Win More Jobs
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to run a successful contracting business, all integrated and working together seamlessly.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
          {tools.map((tool, index) => (
            <div
              key={tool.name}
              className="flex items-center gap-3 px-6 py-4 bg-card rounded-full border border-border shadow-sm hover:shadow-md hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group animate-fade-in-up"
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <tool.icon className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                {tool.name}
              </span>
            </div>
          ))}
        </div>

        {/* Workflow Illustration */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-8 md:p-12 text-center border border-primary/10">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              One Login. One Platform. <span className="text-primary">Endless Time Savings.</span>
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              With GCN, you can go from lead capture to final payment without ever leaving the platform. 
              Stop wasting time switching between apps and focus on what you do best—growing your business.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingToolPills;
