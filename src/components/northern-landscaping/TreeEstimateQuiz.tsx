import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  TreeDeciduous,
  Scissors,
  CircleDot,
  Droplets,
  Sun,
  Layers,
  Bug,
  Sparkles,
  Mountain,
  Home,
  Waves,
  Apple,
  Umbrella,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Phone,
  RotateCcw,
  Zap,
  MapPin,
  AlertTriangle,
  Truck,
} from "lucide-react";

// Service categories with all 16 services
const serviceCategories = [
  {
    category: "Tree Services",
    services: [
      { id: "tree-trimming", label: "Tree Trimming", icon: Scissors, description: "Pruning & shaping" },
      { id: "tree-removal", label: "Tree Removal", icon: TreeDeciduous, description: "Complete tree removal" },
      { id: "stump-grinding", label: "Stump Grinding", icon: CircleDot, description: "Remove existing stumps" },
      { id: "storm-cleanup", label: "Storm Cleanup", icon: AlertTriangle, description: "Emergency tree services" },
    ],
  },
  {
    category: "Lawn & Turf",
    services: [
      { id: "lawn-maintenance", label: "Lawn Maintenance", icon: Layers, description: "Regular mowing & care" },
      { id: "artificial-turf", label: "Artificial Turf", icon: Layers, description: "Install synthetic grass" },
      { id: "turf-cleaning", label: "Artificial Turf Cleaning", icon: Sparkles, description: "Clean & maintain turf" },
      { id: "fertilization", label: "Fertilization", icon: Droplets, description: "Lawn fertilizing program" },
    ],
  },
  {
    category: "Water & Lighting",
    services: [
      { id: "irrigation", label: "Irrigation", icon: Droplets, description: "Sprinkler systems" },
      { id: "landscape-lighting", label: "Landscape Lighting", icon: Sun, description: "Outdoor lighting" },
      { id: "waterfalls", label: "Waterfalls", icon: Waves, description: "Water features" },
    ],
  },
  {
    category: "Hardscaping",
    services: [
      { id: "pavers", label: "Pavers", icon: Layers, description: "Paver installation" },
      { id: "land-grading", label: "Land Grading", icon: Mountain, description: "Grade & level land" },
      { id: "tiki-pergolas", label: "Tiki Huts & Pergolas", icon: Umbrella, description: "Outdoor structures" },
    ],
  },
  {
    category: "Other Services",
    services: [
      { id: "pest-control", label: "Pest Control", icon: Bug, description: "Lawn pest treatment" },
      { id: "pressure-cleaning", label: "Pressure Cleaning", icon: Sparkles, description: "Power washing" },
      { id: "fruit-trees", label: "Fruit Tree Installation", icon: Apple, description: "Plant fruit trees" },
    ],
  },
];

// Service-specific questions
const serviceQuestions: Record<string, { question: string; options: { id: string; label: string; description?: string }[] }[]> = {
  "tree-trimming": [
    {
      question: "How many trees need trimming?",
      options: [
        { id: "1", label: "1 Tree" },
        { id: "2-3", label: "2-3 Trees" },
        { id: "4-6", label: "4-6 Trees" },
        { id: "7+", label: "7+ Trees" },
      ],
    },
    {
      question: "What's the average tree size?",
      options: [
        { id: "small", label: "Small", description: "Up to 30 ft" },
        { id: "medium", label: "Medium", description: "30-60 ft" },
        { id: "large", label: "Large", description: "Over 60 ft" },
      ],
    },
  ],
  "tree-removal": [
    {
      question: "How large is the tree?",
      options: [
        { id: "small", label: "Small", description: "Up to 30 ft (1-story height)" },
        { id: "medium", label: "Medium", description: "30-60 ft (2-story height)" },
        { id: "large", label: "Large", description: "Over 60 ft (very tall)" },
      ],
    },
    {
      question: "Any obstacles nearby?",
      options: [
        { id: "none", label: "No obstacles" },
        { id: "structure", label: "Near a structure" },
        { id: "powerlines", label: "Near power lines" },
        { id: "access", label: "Hard to access" },
      ],
    },
  ],
  "stump-grinding": [
    {
      question: "How many stumps need grinding?",
      options: [
        { id: "1", label: "1 Stump" },
        { id: "2-3", label: "2-3 Stumps" },
        { id: "4-6", label: "4-6 Stumps" },
        { id: "7+", label: "7+ Stumps" },
      ],
    },
    {
      question: "What's the average stump diameter?",
      options: [
        { id: "small", label: "Small", description: "Under 12 inches" },
        { id: "medium", label: "Medium", description: "12-24 inches" },
        { id: "large", label: "Large", description: "Over 24 inches" },
      ],
    },
  ],
  "storm-cleanup": [
    {
      question: "What type of damage?",
      options: [
        { id: "fallen-tree", label: "Fallen tree(s)" },
        { id: "broken-branches", label: "Broken branches" },
        { id: "multiple", label: "Multiple issues" },
      ],
    },
    {
      question: "Is it an emergency?",
      options: [
        { id: "urgent", label: "Yes, blocking access or hazardous" },
        { id: "soon", label: "Can wait a day or two" },
        { id: "not-urgent", label: "Not urgent" },
      ],
    },
  ],
  "lawn-maintenance": [
    {
      question: "What's your property size?",
      options: [
        { id: "small", label: "Small", description: "Under 5,000 sq ft" },
        { id: "medium", label: "Medium", description: "5,000-10,000 sq ft" },
        { id: "large", label: "Large", description: "10,000-20,000 sq ft" },
        { id: "xlarge", label: "Very Large", description: "Over 20,000 sq ft" },
      ],
    },
    {
      question: "How often do you need service?",
      options: [
        { id: "weekly", label: "Weekly" },
        { id: "biweekly", label: "Bi-weekly" },
        { id: "monthly", label: "Monthly" },
        { id: "one-time", label: "One-time cleanup" },
      ],
    },
  ],
  "artificial-turf": [
    {
      question: "What's the approximate area?",
      options: [
        { id: "small", label: "Small", description: "Under 500 sq ft" },
        { id: "medium", label: "Medium", description: "500-1,000 sq ft" },
        { id: "large", label: "Large", description: "1,000-2,000 sq ft" },
        { id: "xlarge", label: "Very Large", description: "Over 2,000 sq ft" },
      ],
    },
    {
      question: "What's the primary use?",
      options: [
        { id: "lawn", label: "Lawn replacement" },
        { id: "pet", label: "Pet area" },
        { id: "play", label: "Play area" },
        { id: "putting", label: "Putting green" },
      ],
    },
  ],
  "turf-cleaning": [
    {
      question: "What's the approximate area?",
      options: [
        { id: "small", label: "Small", description: "Under 500 sq ft" },
        { id: "medium", label: "Medium", description: "500-1,000 sq ft" },
        { id: "large", label: "Large", description: "Over 1,000 sq ft" },
      ],
    },
    {
      question: "Do you have pets?",
      options: [
        { id: "yes", label: "Yes" },
        { id: "no", label: "No" },
      ],
    },
  ],
  "fertilization": [
    {
      question: "What's your property size?",
      options: [
        { id: "small", label: "Small", description: "Under 5,000 sq ft" },
        { id: "medium", label: "Medium", description: "5,000-10,000 sq ft" },
        { id: "large", label: "Large", description: "Over 10,000 sq ft" },
      ],
    },
    {
      question: "What program interests you?",
      options: [
        { id: "one-time", label: "One-time application" },
        { id: "quarterly", label: "Quarterly program" },
        { id: "monthly", label: "Monthly program" },
      ],
    },
  ],
  "irrigation": [
    {
      question: "What do you need?",
      options: [
        { id: "new-install", label: "New system installation" },
        { id: "repair", label: "Repair existing system" },
        { id: "upgrade", label: "Upgrade/add zones" },
        { id: "inspection", label: "System inspection" },
      ],
    },
    {
      question: "What's your property size?",
      options: [
        { id: "small", label: "Small", description: "Under 5,000 sq ft" },
        { id: "medium", label: "Medium", description: "5,000-15,000 sq ft" },
        { id: "large", label: "Large", description: "Over 15,000 sq ft" },
      ],
    },
  ],
  "landscape-lighting": [
    {
      question: "What type of lighting?",
      options: [
        { id: "path", label: "Path/walkway lighting" },
        { id: "accent", label: "Accent/uplighting" },
        { id: "security", label: "Security lighting" },
        { id: "full", label: "Full landscape lighting" },
      ],
    },
    {
      question: "How many fixtures needed?",
      options: [
        { id: "small", label: "5-10 fixtures" },
        { id: "medium", label: "10-20 fixtures" },
        { id: "large", label: "20+ fixtures" },
      ],
    },
  ],
  "waterfalls": [
    {
      question: "What type of water feature?",
      options: [
        { id: "pondless", label: "Pondless waterfall" },
        { id: "pond", label: "Pond with waterfall" },
        { id: "fountain", label: "Fountain" },
        { id: "custom", label: "Custom feature" },
      ],
    },
    {
      question: "What size are you considering?",
      options: [
        { id: "small", label: "Small", description: "Accent piece" },
        { id: "medium", label: "Medium", description: "Focal point" },
        { id: "large", label: "Large", description: "Major feature" },
      ],
    },
  ],
  "pavers": [
    {
      question: "What area needs pavers?",
      options: [
        { id: "driveway", label: "Driveway" },
        { id: "patio", label: "Patio" },
        { id: "walkway", label: "Walkway" },
        { id: "pool-deck", label: "Pool deck" },
      ],
    },
    {
      question: "What's the approximate size?",
      options: [
        { id: "small", label: "Small", description: "Under 200 sq ft" },
        { id: "medium", label: "Medium", description: "200-500 sq ft" },
        { id: "large", label: "Large", description: "500-1,000 sq ft" },
        { id: "xlarge", label: "Very Large", description: "Over 1,000 sq ft" },
      ],
    },
  ],
  "land-grading": [
    {
      question: "What's the purpose?",
      options: [
        { id: "drainage", label: "Improve drainage" },
        { id: "level", label: "Level for construction" },
        { id: "slope", label: "Create slope/contour" },
        { id: "pool", label: "Pool preparation" },
      ],
    },
    {
      question: "What's the approximate area?",
      options: [
        { id: "small", label: "Small", description: "Under 1,000 sq ft" },
        { id: "medium", label: "Medium", description: "1,000-5,000 sq ft" },
        { id: "large", label: "Large", description: "Over 5,000 sq ft" },
      ],
    },
  ],
  "tiki-pergolas": [
    {
      question: "What type of structure?",
      options: [
        { id: "tiki", label: "Tiki hut" },
        { id: "pergola", label: "Pergola" },
        { id: "gazebo", label: "Gazebo" },
        { id: "arbor", label: "Arbor" },
      ],
    },
    {
      question: "What size are you considering?",
      options: [
        { id: "small", label: "Small", description: "8x8 or smaller" },
        { id: "medium", label: "Medium", description: "10x10 to 12x12" },
        { id: "large", label: "Large", description: "14x14 or larger" },
      ],
    },
  ],
  "pest-control": [
    {
      question: "What pest issues do you have?",
      options: [
        { id: "chinch", label: "Chinch bugs" },
        { id: "grubs", label: "Grubs" },
        { id: "ants", label: "Fire ants" },
        { id: "multiple", label: "Multiple/unknown" },
      ],
    },
    {
      question: "What's your property size?",
      options: [
        { id: "small", label: "Small", description: "Under 5,000 sq ft" },
        { id: "medium", label: "Medium", description: "5,000-10,000 sq ft" },
        { id: "large", label: "Large", description: "Over 10,000 sq ft" },
      ],
    },
  ],
  "pressure-cleaning": [
    {
      question: "What needs cleaning?",
      options: [
        { id: "driveway", label: "Driveway" },
        { id: "patio", label: "Patio/walkways" },
        { id: "house", label: "House exterior" },
        { id: "roof", label: "Roof" },
        { id: "pool-deck", label: "Pool deck" },
      ],
    },
    {
      question: "What's the approximate size?",
      options: [
        { id: "small", label: "Small", description: "Under 500 sq ft" },
        { id: "medium", label: "Medium", description: "500-1,500 sq ft" },
        { id: "large", label: "Large", description: "Over 1,500 sq ft" },
      ],
    },
  ],
  "fruit-trees": [
    {
      question: "How many trees do you want?",
      options: [
        { id: "1", label: "1 Tree" },
        { id: "2-3", label: "2-3 Trees" },
        { id: "4-6", label: "4-6 Trees" },
        { id: "orchard", label: "7+ Trees (mini orchard)" },
      ],
    },
    {
      question: "What type of fruit trees?",
      options: [
        { id: "citrus", label: "Citrus (orange, lemon, lime)" },
        { id: "tropical", label: "Tropical (mango, avocado)" },
        { id: "mix", label: "Mix of varieties" },
      ],
    },
  ],
};

// Pricing logic
const calculateEstimate = (serviceId: string, answers: string[]): { low: number; high: number } => {
  let baseLow = 0;
  let baseHigh = 0;

  switch (serviceId) {
    case "tree-trimming":
      const treeCount = answers[0];
      const treeSize = answers[1];
      if (treeSize === "small") { baseLow = 150; baseHigh = 350; }
      else if (treeSize === "medium") { baseLow = 300; baseHigh = 600; }
      else { baseLow = 500; baseHigh = 1200; }
      if (treeCount === "2-3") { baseLow *= 2; baseHigh *= 2.5; }
      else if (treeCount === "4-6") { baseLow *= 3.5; baseHigh *= 4; }
      else if (treeCount === "7+") { baseLow *= 5; baseHigh *= 6; }
      break;

    case "tree-removal":
      const removalSize = answers[0];
      const obstacle = answers[1];
      if (removalSize === "small") { baseLow = 300; baseHigh = 600; }
      else if (removalSize === "medium") { baseLow = 600; baseHigh = 1500; }
      else { baseLow = 1500; baseHigh = 3500; }
      if (obstacle === "structure") { baseLow *= 1.2; baseHigh *= 1.3; }
      else if (obstacle === "powerlines") { baseLow *= 1.3; baseHigh *= 1.4; }
      else if (obstacle === "access") { baseLow *= 1.15; baseHigh *= 1.2; }
      break;

    case "stump-grinding":
      const stumpCount = answers[0];
      const stumpSize = answers[1];
      if (stumpSize === "small") { baseLow = 75; baseHigh = 150; }
      else if (stumpSize === "medium") { baseLow = 150; baseHigh = 300; }
      else { baseLow = 300; baseHigh = 500; }
      if (stumpCount === "2-3") { baseLow *= 1.8; baseHigh *= 2; }
      else if (stumpCount === "4-6") { baseLow *= 3; baseHigh *= 3.5; }
      else if (stumpCount === "7+") { baseLow *= 4.5; baseHigh *= 5; }
      break;

    case "storm-cleanup":
      const damageType = answers[0];
      const urgency = answers[1];
      if (damageType === "broken-branches") { baseLow = 200; baseHigh = 500; }
      else if (damageType === "fallen-tree") { baseLow = 500; baseHigh = 1500; }
      else { baseLow = 800; baseHigh = 2500; }
      if (urgency === "urgent") { baseLow *= 1.5; baseHigh *= 1.5; }
      break;

    case "lawn-maintenance":
      const lawnSize = answers[0];
      const frequency = answers[1];
      if (lawnSize === "small") { baseLow = 35; baseHigh = 50; }
      else if (lawnSize === "medium") { baseLow = 50; baseHigh = 75; }
      else if (lawnSize === "large") { baseLow = 75; baseHigh = 100; }
      else { baseLow = 100; baseHigh = 150; }
      if (frequency === "one-time") { baseLow *= 2; baseHigh *= 2; }
      break;

    case "artificial-turf":
      const turfArea = answers[0];
      if (turfArea === "small") { baseLow = 4000; baseHigh = 6000; }
      else if (turfArea === "medium") { baseLow = 6000; baseHigh = 12000; }
      else if (turfArea === "large") { baseLow = 12000; baseHigh = 24000; }
      else { baseLow = 24000; baseHigh = 40000; }
      break;

    case "turf-cleaning":
      const cleanArea = answers[0];
      const hasPets = answers[1];
      if (cleanArea === "small") { baseLow = 100; baseHigh = 175; }
      else if (cleanArea === "medium") { baseLow = 175; baseHigh = 300; }
      else { baseLow = 300; baseHigh = 500; }
      if (hasPets === "yes") { baseLow *= 1.25; baseHigh *= 1.25; }
      break;

    case "fertilization":
      const fertSize = answers[0];
      const fertProgram = answers[1];
      if (fertSize === "small") { baseLow = 50; baseHigh = 75; }
      else if (fertSize === "medium") { baseLow = 75; baseHigh = 125; }
      else { baseLow = 125; baseHigh = 200; }
      if (fertProgram === "quarterly") { baseLow *= 4; baseHigh *= 4; }
      else if (fertProgram === "monthly") { baseLow *= 12; baseHigh *= 12; }
      break;

    case "irrigation":
      const irrigationType = answers[0];
      const irrigationSize = answers[1];
      if (irrigationType === "repair") { baseLow = 75; baseHigh = 300; }
      else if (irrigationType === "inspection") { baseLow = 50; baseHigh = 100; }
      else if (irrigationType === "upgrade") { baseLow = 500; baseHigh = 1500; }
      else {
        if (irrigationSize === "small") { baseLow = 2000; baseHigh = 3500; }
        else if (irrigationSize === "medium") { baseLow = 3500; baseHigh = 6000; }
        else { baseLow = 6000; baseHigh = 12000; }
      }
      break;

    case "landscape-lighting":
      const fixtureCount = answers[1];
      if (fixtureCount === "small") { baseLow = 1500; baseHigh = 3000; }
      else if (fixtureCount === "medium") { baseLow = 3000; baseHigh = 6000; }
      else { baseLow = 6000; baseHigh = 12000; }
      break;

    case "waterfalls":
      const waterfallSize = answers[1];
      if (waterfallSize === "small") { baseLow = 2500; baseHigh = 5000; }
      else if (waterfallSize === "medium") { baseLow = 5000; baseHigh = 10000; }
      else { baseLow = 10000; baseHigh = 20000; }
      break;

    case "pavers":
      const paverSize = answers[1];
      if (paverSize === "small") { baseLow = 2000; baseHigh = 4000; }
      else if (paverSize === "medium") { baseLow = 4000; baseHigh = 8000; }
      else if (paverSize === "large") { baseLow = 8000; baseHigh = 15000; }
      else { baseLow = 15000; baseHigh = 30000; }
      break;

    case "land-grading":
      const gradingSize = answers[1];
      if (gradingSize === "small") { baseLow = 500; baseHigh = 1500; }
      else if (gradingSize === "medium") { baseLow = 1500; baseHigh = 4000; }
      else { baseLow = 4000; baseHigh = 10000; }
      break;

    case "tiki-pergolas":
      const structureSize = answers[1];
      if (structureSize === "small") { baseLow = 3000; baseHigh = 6000; }
      else if (structureSize === "medium") { baseLow = 6000; baseHigh = 12000; }
      else { baseLow = 12000; baseHigh = 25000; }
      break;

    case "pest-control":
      const pestSize = answers[1];
      if (pestSize === "small") { baseLow = 75; baseHigh = 125; }
      else if (pestSize === "medium") { baseLow = 125; baseHigh = 200; }
      else { baseLow = 200; baseHigh = 350; }
      break;

    case "pressure-cleaning":
      const pressureSize = answers[1];
      if (pressureSize === "small") { baseLow = 100; baseHigh = 200; }
      else if (pressureSize === "medium") { baseLow = 200; baseHigh = 400; }
      else { baseLow = 400; baseHigh = 800; }
      break;

    case "fruit-trees":
      const fruitCount = answers[0];
      if (fruitCount === "1") { baseLow = 200; baseHigh = 400; }
      else if (fruitCount === "2-3") { baseLow = 400; baseHigh = 900; }
      else if (fruitCount === "4-6") { baseLow = 800; baseHigh = 1500; }
      else { baseLow = 1500; baseHigh = 3000; }
      break;

    default:
      baseLow = 200;
      baseHigh = 1000;
  }

  return { low: Math.round(baseLow), high: Math.round(baseHigh) };
};

const TreeEstimateQuiz = () => {
  const [step, setStep] = useState(0); // 0 = service selection, 1+ = service questions
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);

  const currentQuestions = selectedService ? serviceQuestions[selectedService] || [] : [];
  const totalSteps = currentQuestions.length + 1;

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setAnswers([]);
    setStep(1);
  };

  const handleAnswerSelect = (answerId: string) => {
    const newAnswers = [...answers];
    newAnswers[step - 1] = answerId;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (step < currentQuestions.length) {
      setStep(step + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else if (step === 1) {
      setSelectedService(null);
      setStep(0);
    }
  };

  const resetQuiz = () => {
    setSelectedService(null);
    setAnswers([]);
    setStep(0);
    setShowResult(false);
  };

  const canProceed = () => {
    if (step === 0) return false;
    return answers[step - 1] !== undefined;
  };

  const getServiceLabel = () => {
    for (const category of serviceCategories) {
      const service = category.services.find(s => s.id === selectedService);
      if (service) return service.label;
    }
    return "";
  };

  const estimate = selectedService ? calculateEstimate(selectedService, answers) : { low: 0, high: 0 };

  // Result screen
  if (showResult && selectedService) {
    return (
      <section id="estimate" className="py-20 bg-green-900">
        <div className="container max-w-2xl">
          <Card className="p-8 md:p-12 bg-white shadow-2xl">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mx-auto">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-green-900">
                Your {getServiceLabel()} Estimate
              </h2>

              <div className="bg-green-50 rounded-2xl p-8">
                <p className="text-5xl md:text-6xl font-bold text-green-700">
                  ${estimate.low.toLocaleString()} – ${estimate.high.toLocaleString()}
                </p>
                <p className="text-muted-foreground mt-2">
                  Ballpark estimate based on your selections
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
                <p className="font-semibold text-green-900">Every job includes:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Fully insured, licensed professionals</li>
                  <li>• Free on-site consultation</li>
                  <li>• Complete cleanup after the job</li>
                  <li>• 100% satisfaction guarantee</li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground">
                *Final pricing confirmed with free on-site consultation. No obligation.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <a href="tel:+12149982879">
                  <Button size="lg" className="bg-green-700 hover:bg-green-800 gap-2 w-full sm:w-auto">
                    <Phone className="h-5 w-5" />
                    Call Now: (214) 998-2879
                  </Button>
                </a>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={resetQuiz}
                  className="gap-2 border-green-700 text-green-700 hover:bg-green-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Get Another Estimate
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="estimate" className="py-20 bg-green-900">
      <div className="container max-w-4xl">
        <div className="text-center mb-10">
          <span className="text-green-400 font-semibold text-sm uppercase tracking-wide">
            Instant Estimate
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">
            Get Your Price in 60 Seconds
          </h2>
          <p className="text-green-200">
            Select your service and answer a few questions – no contact info required.
          </p>
        </div>

        <Card className="p-6 md:p-10 bg-white shadow-2xl">
          {/* Progress Bar - only show after service selection */}
          {step > 0 && (
            <div className="mb-8">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Step {step} of {totalSteps - 1}</span>
                <span>{Math.round((step / (totalSteps - 1)) * 100)}% Complete</span>
              </div>
              <Progress value={(step / (totalSteps - 1)) * 100} className="h-2" />
            </div>
          )}

          {/* Step 0: Service Selection */}
          {step === 0 && (
            <div className="space-y-8">
              <h3 className="text-xl font-semibold text-green-900 text-center">
                What service do you need?
              </h3>
              
              {serviceCategories.map((category) => (
                <div key={category.category}>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    {category.category}
                  </h4>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {category.services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => handleServiceSelect(service.id)}
                        className="p-4 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 text-left transition-all group"
                      >
                        <service.icon className="h-6 w-6 mb-2 text-gray-400 group-hover:text-green-600" />
                        <p className="font-semibold text-green-900 text-sm">{service.label}</p>
                        <p className="text-xs text-muted-foreground">{service.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Service-specific questions */}
          {step > 0 && currentQuestions[step - 1] && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-green-900">
                {currentQuestions[step - 1].question}
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {currentQuestions[step - 1].options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswerSelect(option.id)}
                    className={`p-5 rounded-xl border-2 text-left transition-all ${
                      answers[step - 1] === option.id
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    <p className="font-semibold text-green-900">{option.label}</p>
                    {option.description && (
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          {step > 0 && (
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-green-700 hover:bg-green-800 gap-2"
              >
                {step === currentQuestions.length ? "Get Estimate" : "Next"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
};

export default TreeEstimateQuiz;
