import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, FileText } from "lucide-react";

const examples = [
  {
    property: "3/2 Single Family Home - Miami",
    claimType: "Wind Damage",
    statefarm: {
      amount: 8500,
      items: 12,
      notes: "Missing shingle replacement, no underlayment, partial repairs only"
    },
    citizens: {
      amount: 9200,
      items: 15,
      notes: "Included gutters but missed soffit and fascia damage"
    },
    supplementKings: {
      amount: 28750,
      items: 47,
      notes: "Full roof replacement, all code upgrades, interior water damage, HVAC cleaning"
    }
  },
  {
    property: "Commercial Strip Mall - Fort Lauderdale",
    claimType: "Hail Damage",
    statefarm: {
      amount: 45000,
      items: 28,
      notes: "Partial metal roof repair, no interior inspection"
    },
    citizens: {
      amount: 52000,
      items: 35,
      notes: "Added some interior but missed mechanical systems"
    },
    supplementKings: {
      amount: 187500,
      items: 124,
      notes: "Complete TPO replacement, all 8 HVAC units, storefront damage, business interruption"
    }
  },
  {
    property: "4/3 Pool Home - Boca Raton",
    claimType: "Water Damage",
    statefarm: {
      amount: 12800,
      items: 18,
      notes: "Kitchen only, no mold testing, basic materials"
    },
    citizens: {
      amount: 15400,
      items: 22,
      notes: "Added flooring but missed wall cavity inspection"
    },
    supplementKings: {
      amount: 67200,
      items: 89,
      notes: "Full water extraction, mold remediation, cabinet replacement, upgraded materials, living expenses"
    }
  }
];

export function XactimateExamplesSection() {
  return (
    <section id="examples" className="py-20 bg-white">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Real Results: Xactimate Comparison
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            See the difference between insurance company estimates and our comprehensive supplements
          </p>
        </div>

        <div className="space-y-8">
          {examples.map((example, index) => (
            <Card key={index} className="bg-white border-gray-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <CardTitle className="text-gray-900">{example.property}</CardTitle>
                  <Badge className="bg-emerald-600 text-white w-fit">{example.claimType}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                  {/* State Farm */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-8 rounded bg-red-50 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-red-500" />
                      </div>
                      <span className="font-semibold text-gray-700">State Farm</span>
                    </div>
                    <p className="text-3xl font-bold text-red-500 mb-2">
                      ${example.statefarm.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400 mb-3">{example.statefarm.items} line items</p>
                    <p className="text-xs text-gray-500">{example.statefarm.notes}</p>
                  </div>

                  {/* Citizens */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-8 rounded bg-yellow-50 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-yellow-500" />
                      </div>
                      <span className="font-semibold text-gray-700">Citizens</span>
                    </div>
                    <p className="text-3xl font-bold text-yellow-500 mb-2">
                      ${example.citizens.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400 mb-3">{example.citizens.items} line items</p>
                    <p className="text-xs text-gray-500">{example.citizens.notes}</p>
                  </div>

                  {/* Supplement Kings */}
                  <div className="p-6 bg-emerald-50/50">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-8 rounded bg-emerald-100 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="font-semibold text-gray-900">Supplement Kings</span>
                    </div>
                    <p className="text-3xl font-bold text-emerald-600 mb-2">
                      ${example.supplementKings.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400 mb-3">{example.supplementKings.items} line items</p>
                    <p className="text-xs text-gray-700">{example.supplementKings.notes}</p>
                    
                    <div className="mt-4 pt-4 border-t border-emerald-200">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <ArrowRight className="h-4 w-4" />
                        <span className="font-semibold">
                          +${(example.supplementKings.amount - example.statefarm.amount).toLocaleString()} recovered
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round(((example.supplementKings.amount - example.statefarm.amount) / example.statefarm.amount) * 100)}% increase from original estimate
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
