import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, Star, DollarSign, Clock, Percent, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";

interface FinancingPlan {
  id: string;
  rate: number;
  termYears: number;
  termMonths: number;
  dealerFee?: number;
  dealerFeeNote?: string;
  noPaymentPeriod?: number;
  description?: string;
}

interface Lender {
  id: string;
  name: string;
  creditRequirement: string;
  creditBadgeColor: string;
  logo?: string;
  plans: FinancingPlan[];
  note?: string;
}

const lenders: Lender[] = [
  {
    id: "service-finance",
    name: "Service Finance",
    creditRequirement: "Great Credit",
    creditBadgeColor: "bg-emerald-500",
    note: "*Dealer fee may apply",
    plans: [
      { id: "sf-1", rate: 4.99, termYears: 12, termMonths: 144, description: "Lowest rate, 12-year term" },
      { id: "sf-2", rate: 5.99, termYears: 20, termMonths: 240, description: "Extended 20-year term" },
      { id: "sf-3", rate: 6.99, termYears: 15, termMonths: 180, description: "Mid-range 15-year option" },
      { id: "sf-4", rate: 7.99, termYears: 15, termMonths: 180, description: "15-year flexible option" },
      { id: "sf-5", rate: 8.99, termYears: 12, termMonths: 144, description: "Quick payoff 12-year" }
    ]
  },
  {
    id: "goodleap",
    name: "GoodLeap",
    creditRequirement: "Good Credit",
    creditBadgeColor: "bg-blue-500",
    plans: [
      { 
        id: "gl-1", 
        rate: 0, 
        termYears: 1, 
        termMonths: 12, 
        dealerFee: 5, 
        noPaymentPeriod: 12,
        description: "No payment, no interest for 12 months",
        dealerFeeNote: "5% dealer fee added to loan amount"
      },
      { 
        id: "gl-2", 
        rate: 12.99, 
        termYears: 10, 
        termMonths: 120, 
        description: "Standard 10-year financing" 
      }
    ]
  },
  {
    id: "pace",
    name: "PACE Financing",
    creditRequirement: "Any Credit",
    creditBadgeColor: "bg-amber-500",
    note: "Property-secured financing",
    plans: [
      { 
        id: "pace-1", 
        rate: 8.49, 
        termYears: 10, 
        termMonths: 120, 
        dealerFee: 10,
        description: "10-year term",
        dealerFeeNote: "10% dealer fee added to loan amount"
      },
      { 
        id: "pace-2", 
        rate: 8.49, 
        termYears: 15, 
        termMonths: 180, 
        dealerFee: 10,
        description: "15-year term",
        dealerFeeNote: "10% dealer fee added to loan amount"
      },
      { 
        id: "pace-3", 
        rate: 8.49, 
        termYears: 20, 
        termMonths: 240, 
        dealerFee: 10,
        description: "20-year extended term",
        dealerFeeNote: "10% dealer fee added to loan amount"
      }
    ]
  }
];

const calculateMonthlyPayment = (
  principal: number, 
  annualRate: number, 
  months: number,
  dealerFeePercent?: number
): { monthly: number; totalCost: number; totalInterest: number; adjustedPrincipal: number } => {
  const adjustedPrincipal = dealerFeePercent 
    ? principal * (1 + dealerFeePercent / 100) 
    : principal;
  
  const monthlyRate = annualRate / 100 / 12;
  
  let monthly: number;
  if (monthlyRate === 0) {
    monthly = adjustedPrincipal / months;
  } else {
    monthly = adjustedPrincipal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
              (Math.pow(1 + monthlyRate, months) - 1);
  }
  
  const totalCost = monthly * months;
  const totalInterest = totalCost - adjustedPrincipal;
  
  return { monthly, totalCost, totalInterest, adjustedPrincipal };
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

interface FinancingCalculatorProps {
  defaultAmount?: number;
}

export const FinancingCalculator = ({ defaultAmount }: FinancingCalculatorProps) => {
  const [loanAmount, setLoanAmount] = useState(defaultAmount?.toString() || "15000");
  const [selectedLender, setSelectedLender] = useState<string>("service-finance");
  const [selectedPlan, setSelectedPlan] = useState<string>("");

  const amount = parseFloat(loanAmount.replace(/,/g, '')) || 0;
  const currentLender = lenders.find(l => l.id === selectedLender);

  const calculations = useMemo(() => {
    if (!currentLender || amount <= 0) return [];
    
    return currentLender.plans.map(plan => ({
      plan,
      ...calculateMonthlyPayment(amount, plan.rate, plan.termMonths, plan.dealerFee)
    }));
  }, [currentLender, amount]);

  const selectedCalc = calculations.find(c => c.plan.id === selectedPlan);

  return (
    <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container">
        <div className="text-center space-y-4 mb-12">
          <Badge variant="secondary" className="text-sm">
            <Calculator className="h-3 w-3 mr-1" />
            Financing Options
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Flexible <span className="text-primary">Payment Plans</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore financing options from our trusted lending partners. 
            Find the perfect payment plan for your budget.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Calculate Your Monthly Payment
              </CardTitle>
              <CardDescription>
                Enter your estimated roof cost to see monthly payment options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Loan Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="loan-amount">Roof Estimate Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="loan-amount"
                    type="text"
                    value={loanAmount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setLoanAmount(value);
                    }}
                    className="pl-9 text-lg font-semibold"
                    placeholder="15000"
                  />
                </div>
              </div>

              {/* Lender Tabs */}
              <Tabs value={selectedLender} onValueChange={(v) => { setSelectedLender(v); setSelectedPlan(""); }}>
                <TabsList className="grid w-full grid-cols-3">
                  {lenders.map(lender => (
                    <TabsTrigger key={lender.id} value={lender.id} className="text-xs sm:text-sm">
                      <div className="flex flex-col items-center gap-1">
                        <span>{lender.name}</span>
                        <Badge className={`${lender.creditBadgeColor} text-white text-[10px] px-1.5 py-0`}>
                          {lender.creditRequirement}
                        </Badge>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {lenders.map(lender => (
                  <TabsContent key={lender.id} value={lender.id} className="mt-6">
                    <div className="space-y-4">
                      {/* Plans Table */}
                      <div className="rounded-lg border overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-3 text-sm font-medium">Plan</th>
                              <th className="text-center p-3 text-sm font-medium">Rate</th>
                              <th className="text-center p-3 text-sm font-medium">Term</th>
                              <th className="text-right p-3 text-sm font-medium">Monthly</th>
                              <th className="text-center p-3 text-sm font-medium w-24">Select</th>
                            </tr>
                          </thead>
                          <tbody>
                            {calculations.map((calc, idx) => (
                              <tr 
                                key={calc.plan.id}
                                className={`border-t cursor-pointer transition-colors ${
                                  selectedPlan === calc.plan.id 
                                    ? 'bg-primary/10' 
                                    : 'hover:bg-muted/30'
                                }`}
                                onClick={() => setSelectedPlan(calc.plan.id)}
                              >
                                <td className="p-3">
                                  <div className="text-sm font-medium">{calc.plan.description}</div>
                                  {calc.plan.dealerFeeNote && (
                                    <div className="text-xs text-amber-600">{calc.plan.dealerFeeNote}</div>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex flex-col items-center">
                                    <span className="font-semibold text-primary">{calc.plan.rate}%</span>
                                    {lender.id === "service-finance" && (
                                      <span className="text-[10px] text-muted-foreground">*</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 text-center text-sm">
                                  {calc.plan.termYears} years
                                </td>
                                <td className="p-3 text-right">
                                  <span className="font-bold text-lg">{formatCurrency(calc.monthly)}</span>
                                  <span className="text-xs text-muted-foreground">/mo</span>
                                </td>
                                <td className="p-3 text-center">
                                  <Button 
                                    size="sm" 
                                    variant={selectedPlan === calc.plan.id ? "default" : "outline"}
                                  >
                                    {selectedPlan === calc.plan.id ? (
                                      <CheckCircle2 className="h-4 w-4" />
                                    ) : (
                                      "Select"
                                    )}
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Lender Note */}
                      {lender.note && (
                        <p className="text-xs text-muted-foreground text-center">
                          {lender.note}
                        </p>
                      )}

                      {/* Selected Plan Details */}
                      {selectedCalc && (
                        <Card className="bg-primary/5 border-primary/20">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Monthly Payment</div>
                                <div className="text-2xl font-bold text-primary">{formatCurrency(selectedCalc.monthly)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">
                                  {selectedCalc.plan.dealerFee ? "Amount Financed" : "Loan Amount"}
                                </div>
                                <div className="text-lg font-semibold">{formatCurrency(selectedCalc.adjustedPrincipal)}</div>
                                {selectedCalc.plan.dealerFee && (
                                  <div className="text-xs text-amber-600">includes {selectedCalc.plan.dealerFee}% fee</div>
                                )}
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Total Interest</div>
                                <div className="text-lg font-semibold">{formatCurrency(selectedCalc.totalInterest)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Total Cost</div>
                                <div className="text-lg font-semibold">{formatCurrency(selectedCalc.totalCost)}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Special Promo for GoodLeap 0% */}
                      {lender.id === "goodleap" && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <Star className="h-5 w-5 text-blue-500" />
                          <span className="text-sm">
                            <strong>0% Interest Promo:</strong> Pay nothing for 12 months! 
                            A 5% dealer fee is added to your loan amount.
                          </span>
                        </div>
                      )}

                      {/* PACE Info */}
                      {lender.id === "pace" && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">
                            <strong>PACE Financing:</strong> No credit check required. 
                            The loan is secured by your property and paid through your property tax bill. 
                            A 10% dealer fee is added to the loan amount.
                          </span>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              {/* Apply Button */}
              <Button size="lg" className="w-full" disabled={!selectedPlan}>
                <CreditCard className="h-4 w-4 mr-2" />
                Apply for Financing
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
