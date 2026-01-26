import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, CheckCircle2, FileUp, Package } from "lucide-react";
import AITrainingAnalytics from "./AITrainingAnalytics";
import TrainingDataVerification from "./TrainingDataVerification";
import ReportUploadCenter from "./ReportUploadCenter";
import ExtractedProductsTab from "./ExtractedProductsTab";

const AITrainingCenter = () => {
  const [activeSubTab, setActiveSubTab] = useState("analytics");

  return (
    <div className="space-y-4">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="bg-purple-50 border border-purple-200">
          <TabsTrigger 
            value="analytics" 
            className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger 
            value="ground-truth" 
            className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <CheckCircle2 className="h-4 w-4" />
            Ground Truth
          </TabsTrigger>
          <TabsTrigger 
            value="report-upload" 
            className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <FileUp className="h-4 w-4" />
            Report Upload
          </TabsTrigger>
          <TabsTrigger 
            value="extracted-products" 
            className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <Package className="h-4 w-4" />
            Extracted Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-4">
          <AITrainingAnalytics />
        </TabsContent>

        <TabsContent value="ground-truth" className="mt-4">
          <TrainingDataVerification />
        </TabsContent>

        <TabsContent value="report-upload" className="mt-4">
          <ReportUploadCenter />
        </TabsContent>

        <TabsContent value="extracted-products" className="mt-4">
          <ExtractedProductsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AITrainingCenter;
