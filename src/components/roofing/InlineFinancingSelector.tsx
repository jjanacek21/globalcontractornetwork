import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, CheckCircle2, XCircle } from "lucide-react";

interface FinancingPlan {
  id: string;
  rate: number;
  termYears: number;
  termMonths: number;
  dealerFee?: number;
  description?: string;
}

interface Lender {
  id: string;
  name: string;
  creditRequirement: string;
  creditBadgeColor: string;
  plans: FinancingPlan[];
}

export interface SelectedFinancing {
  lenderName: string;
  planId: string;
  rate: number;
  termYears: number;
  monthlyPayment: number;
  totalCost: number;
}

const lenders: Lender[] = [
  {
    id: "service-finance",
    name: "Service Finance",
    creditRequirement: "Great Credit",
    creditBadgeColor: "bg-emerald-500",
    plans: [
      { id: "sf-1", rate: 4.99, termYears: 12, termMonths: 144, description: "Lowest rate, 12-year" },
      { id: "sf-2", rate: 5.99, termYears: 20, termMonths: 240, description: "Extended 20-year" },
      { id: "sf-3", rate: 6.99, termYears: 15, termMonths: 180, description: "Mid-range 15-year" },
    ]
  },
  {
    id: "goodleap",
    name: "GoodLeap",
    creditRequirement: "Good Credit",
    creditBadgeColor: "bg-blue-500",
    plans: [
      { id: "gl-1", rate: 0, termYears: 1, termMonths: 12, dealerFee: 5, description: "0% for 12 months" },
      { id: "gl-2", rate: 12.99, termYears: 10, termMonths: 120, description: "Standard 10-year" }
    ]
  },
  {
    id: "pace",
    name: "PACE",
    creditRequirement: "Any Credit",
    creditBadgeColor: "bg-amber-500",
    plans: [
      { id: "pace-1", rate: 8.49, termYears: 10, termMonths: 120, dealerFee: 10, description: "10-year term" },
      { id: "pace-2", rate: 8.49, termYears: 20, termMonths: 240, dealerFee: 10, description: "20-year term" }
    ]
  }
];

const calculateMonthlyPayment = (
  principal: number, 
  annualRate: number, 
  months: number,
  dealerFeePercent?: number
): { monthly: number; totalCost: number } => {
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
  
  return { monthly, totalCost };
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

interface InlineFinancingSelectorProps {
  estimateAmount: number;
  onSelect: (financing: SelectedFinancing | null) => void;
  selectedPlanId?: string | null;
}

export const InlineFinancingSelector = ({ 
  estimateAmount, 
  onSelect,
  selectedPlanId
}: InlineFinancingSelectorProps) => {
  const [selectedLender, setSelectedLender] = useState<string>("service-finance");
  const [internalSelectedPlan, setInternalSelectedPlan] = useState<string | null>(selectedPlanId || null);

  const currentLender = lenders.find(l => l.id === selectedLender);

  const calculations = useMemo(() => {
    if (!currentLender || estimateAmount <= 0) return [];
    
    return currentLender.plans.map(plan => ({
      plan,
      ...calculateMonthlyPayment(estimateAmount, plan.rate, plan.termMonths, plan.dealerFee)
    }));
  }, [currentLender, estimateAmount]);

  const handleSelectPlan = (planId: string) => {
    const calc = calculations.find(c => c.plan.id === planId);
    if (!calc || !currentLender) return;

    if (internalSelectedPlan === planId) {
      // Deselect
      setInternalSelectedPlan(null);
      onSelect(null);
    } else {
      setInternalSelectedPlan(planId);
      onSelect({
        lenderName: currentLender.name,
        planId: calc.plan.id,
        rate: calc.plan.rate,
        termYears: calc.plan.termYears,
        monthlyPayment: calc.monthly,
        totalCost: calc.totalCost
      });
    }
  };

  const handleSkip = () => {
    setInternalSelectedPlan(null);
    onSelect(null);
  };

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <span className="font-medium">Add Financing (Optional)</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSkip}
            className="text-muted-foreground text-xs"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Skip
          </Button>
        </div>

        <Tabs value={selectedLender} onValueChange={(v) => { 
          setSelectedLender(v); 
          setInternalSelectedPlan(null);
          onSelect(null);
        }}>
          <TabsList className="grid w-full grid-cols-3 h-auto">
            {lenders.map(lender => (
              <TabsTrigger key={lender.id} value={lender.id} className="text-xs py-2 px-1">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-medium">{lender.name}</span>
                  <Badge className={`${lender.creditBadgeColor} text-white text-[9px] px-1 py-0`}>
                    {lender.creditRequirement}
                  </Badge>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {lenders.map(lender => (
            <TabsContent key={lender.id} value={lender.id} className="mt-3">
              <div className="space-y-2">
                {calculations.map((calc) => (
                  <div
                    key={calc.plan.id}
                    onClick={() => handleSelectPlan(calc.plan.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      internalSelectedPlan === calc.plan.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        internalSelectedPlan === calc.plan.id 
                          ? 'border-primary bg-primary' 
                          : 'border-muted-foreground'
                      }`}>
                        {internalSelectedPlan === calc.plan.id && (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{calc.plan.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {calc.plan.rate}% APR • {calc.plan.termYears} years
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(calc.monthly)}
                        <span className="text-xs font-normal text-muted-foreground">/mo</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {internalSelectedPlan && (
          <div className="mt-3 p-2 bg-primary/5 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">
              Selected payment plan will be included in your estimate PDF
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
