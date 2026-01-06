import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Check, X, Clock, Wind, Droplets, FileText, ArrowRightLeft } from "lucide-react";

interface WarrantyTier {
  name: string;
  years: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  packages: string[];
  coverage: {
    workmanship: boolean;
    materialDefects: string;
    windDamage: string;
    leakRepair: string;
    transferable: string;
  };
}

const warrantyTiers: WarrantyTier[] = [
  {
    name: "5-Year Basic",
    years: "5",
    icon: <Shield className="h-6 w-6" />,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10 border-amber-500/30",
    packages: ["Bronze Roof Package", "Roof Refresh"],
    coverage: {
      workmanship: true,
      materialDefects: "Limited",
      windDamage: "Up to 90 mph",
      leakRepair: "Labor only",
      transferable: "No"
    }
  },
  {
    name: "10-Year Standard",
    years: "10",
    icon: <Shield className="h-6 w-6" />,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10 border-blue-500/30",
    packages: ["Silver Roof Package", "The Blue Collar Special", "Tile Roof Package"],
    coverage: {
      workmanship: true,
      materialDefects: "Full",
      windDamage: "Up to 110 mph",
      leakRepair: "Labor + materials",
      transferable: "Yes (1x)"
    }
  },
  {
    name: "Lifetime Premium",
    years: "∞",
    icon: <Shield className="h-6 w-6" />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10 border-emerald-500/30",
    packages: ["Gold Roof Package", "Blue Collar+", "Platinum Roof Package", "Tile+ Roof Package", "Ultimate Roof Package"],
    coverage: {
      workmanship: true,
      materialDefects: "Full",
      windDamage: "Up to 130 mph",
      leakRepair: "Full replacement",
      transferable: "Yes (unlimited)"
    }
  }
];

const coverageItems = [
  { key: "workmanship", label: "Workmanship Coverage", icon: <FileText className="h-4 w-4" /> },
  { key: "materialDefects", label: "Material Defects", icon: <Shield className="h-4 w-4" /> },
  { key: "windDamage", label: "Wind Damage Protection", icon: <Wind className="h-4 w-4" /> },
  { key: "leakRepair", label: "Leak Repair", icon: <Droplets className="h-4 w-4" /> },
  { key: "transferable", label: "Transferable to New Owner", icon: <ArrowRightLeft className="h-4 w-4" /> }
];

export const WarrantyComparison = () => {
  return (
    <section className="py-16">
      <div className="container">
        <div className="text-center space-y-4 mb-12">
          <Badge variant="secondary" className="text-sm">
            <Shield className="h-3 w-3 mr-1" />
            Warranty Protection
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Compare <span className="text-primary">Warranty Coverage</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every package includes warranty protection. 
            See what's covered at each level.
          </p>
        </div>

        {/* Warranty Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {warrantyTiers.map((tier, idx) => (
            <Card 
              key={tier.name} 
              className={`relative overflow-hidden border-2 ${tier.bgColor} ${
                idx === 2 ? 'ring-2 ring-emerald-500/30' : ''
              }`}
            >
              {idx === 2 && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
                  Best Value
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className={`w-16 h-16 rounded-full ${tier.bgColor} flex items-center justify-center mx-auto mb-3 ${tier.color}`}>
                  {tier.icon}
                </div>
                <CardTitle className={`text-xl ${tier.color}`}>{tier.name}</CardTitle>
                <div className="text-4xl font-bold">
                  {tier.years}
                  <span className="text-lg font-normal text-muted-foreground ml-1">
                    {tier.years === "∞" ? "" : "years"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Coverage List */}
                <div className="space-y-2">
                  {coverageItems.map(item => {
                    const value = tier.coverage[item.key as keyof typeof tier.coverage];
                    const isBoolean = typeof value === "boolean";
                    
                    return (
                      <div key={item.key} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {item.icon}
                          <span>{item.label}</span>
                        </div>
                        {isBoolean ? (
                          value ? (
                            <Check className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <X className="h-5 w-5 text-red-500" />
                          )
                        ) : (
                          <span className="font-medium text-foreground">{value}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Included Packages */}
                <div className="pt-4 border-t">
                  <div className="text-xs text-muted-foreground mb-2">Included in:</div>
                  <div className="flex flex-wrap gap-1">
                    {tier.packages.map(pkg => (
                      <Badge key={pkg} variant="outline" className="text-xs font-normal">
                        {pkg.replace(" Roof Package", "").replace(" Package", "")}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison Table for Desktop */}
        <Card className="hidden lg:block">
          <CardHeader>
            <CardTitle className="text-lg">Detailed Warranty Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Coverage</th>
                    {warrantyTiers.map(tier => (
                      <th key={tier.name} className={`text-center p-3 font-medium ${tier.color}`}>
                        {tier.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coverageItems.map((item, idx) => (
                    <tr key={item.key} className={idx % 2 === 0 ? "bg-muted/30" : ""}>
                      <td className="p-3 flex items-center gap-2">
                        {item.icon}
                        {item.label}
                      </td>
                      {warrantyTiers.map(tier => {
                        const value = tier.coverage[item.key as keyof typeof tier.coverage];
                        return (
                          <td key={tier.name} className="text-center p-3">
                            {typeof value === "boolean" ? (
                              value ? (
                                <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-red-500 mx-auto" />
                              )
                            ) : (
                              <span className="font-medium">{value}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            All warranties are backed by manufacturer guarantees. 
            Transferable warranties add value when selling your home.
          </p>
        </div>
      </div>
    </section>
  );
};
