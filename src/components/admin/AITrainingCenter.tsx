import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, CheckCircle2, FileUp, Package, Download, FileText, XCircle, Sparkles, Building } from "lucide-react";
import AITrainingAnalytics from "./AITrainingAnalytics";
import TrainingDataVerification from "./TrainingDataVerification";
import ReportUploadCenter from "./ReportUploadCenter";
import ExtractedProductsTab from "./ExtractedProductsTab";
import { BatchProductSourcing } from "@/components/permit-queens/BatchProductSourcing";
import { TemplateManager } from "@/components/permit-queens/admin/TemplateManager";
import { RejectionTracker } from "@/components/permit-queens/admin/RejectionTracker";
import { SmartDocumentManager } from "@/components/permit-queens/admin/SmartDocumentManager";
import { PropertyDataEnrichment } from "@/components/permit-queens/admin/PropertyDataEnrichment";

const AITrainingCenter = () => {
  const [activeSubTab, setActiveSubTab] = useState("analytics");

  return (
    <div className="space-y-4">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="bg-purple-50 border border-purple-200 flex-wrap h-auto gap-1 p-1">
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
          <TabsTrigger 
            value="batch-sourcing" 
            className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <Download className="h-4 w-4" />
            PDF Sourcing
          </TabsTrigger>
          <TabsTrigger 
            value="templates" 
            className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger 
            value="rejections" 
            className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <XCircle className="h-4 w-4" />
            Rejections
          </TabsTrigger>
          <TabsTrigger 
            value="smart-docs" 
            className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <Sparkles className="h-4 w-4" />
            Smart Docs
          </TabsTrigger>
          <TabsTrigger 
            value="property-data" 
            className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <Building className="h-4 w-4" />
            Property Data
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
        <TabsContent value="batch-sourcing" className="mt-4">
          <BatchProductSourcing />
        </TabsContent>
        <TabsContent value="templates" className="mt-4">
          <TemplateManager />
        </TabsContent>
        <TabsContent value="rejections" className="mt-4">
          <RejectionTracker />
        </TabsContent>
        <TabsContent value="smart-docs" className="mt-4">
          <SmartDocumentManager />
        </TabsContent>
        <TabsContent value="property-data" className="mt-4">
          <PropertyDataEnrichment />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AITrainingCenter;
