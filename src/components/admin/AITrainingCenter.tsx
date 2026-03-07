import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart3, CheckCircle2, FileUp, Package, Download, FileText, XCircle, Sparkles, Building, FileStack, BookOpen, Upload, Brain, Search } from "lucide-react";
import AITrainingAnalytics from "./AITrainingAnalytics";
import TrainingDataVerification from "./TrainingDataVerification";
import ReportUploadCenter from "./ReportUploadCenter";
import ExtractedProductsTab from "./ExtractedProductsTab";
import { BatchProductSourcing } from "@/components/permit-queens/BatchProductSourcing";
import { TemplateManager } from "@/components/permit-queens/admin/TemplateManager";
import { RejectionTracker } from "@/components/permit-queens/admin/RejectionTracker";
import { SmartDocumentManager } from "@/components/permit-queens/admin/SmartDocumentManager";
import { PropertyDataEnrichment } from "@/components/permit-queens/admin/PropertyDataEnrichment";
import { NOABulkManager } from "@/components/permit-queens/admin/NOABulkManager";
import { NOAUploadQueue } from "@/components/permit-queens/admin/NOAUploadQueue";
import { NOACSVImporter } from "@/components/permit-queens/admin/NOACSVImporter";
import { ManufacturerNOASearch } from "@/components/permit-queens/admin/ManufacturerNOASearch";
import NoaSearchTab from "@/components/admin/firecrawl/NoaSearchTab";
import BuildingDeptCrawlerTab from "@/components/admin/firecrawl/BuildingDeptCrawlerTab";
import DiscoveredDocumentsTab from "@/components/admin/firecrawl/DiscoveredDocumentsTab";
import CrawlJobsTab from "@/components/admin/firecrawl/CrawlJobsTab";
import PermitBatchUploader from "./PermitBatchUploader";
import PermitTrainingUploader from "./PermitTrainingUploader";
import TrainingSamplesTable from "./TrainingSamplesTable";
import PermitBooksManager from "./PermitBooksManager";

const AITrainingCenter = () => {
  const [activeSubTab, setActiveSubTab] = useState("analytics");
  const [trainingRefresh, setTrainingRefresh] = useState(0);
  const [trainingMode, setTrainingMode] = useState<"single" | "batch">("batch");

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
          <TabsTrigger 
            value="permit-packets" 
            className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <FileStack className="h-4 w-4" />
            Permit Packets
          </TabsTrigger>
          <TabsTrigger 
            value="books-guides" 
            className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <BookOpen className="h-4 w-4" />
            Books & Guides
          </TabsTrigger>
          <TabsTrigger 
            value="noa-intelligence" 
            className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <Brain className="h-4 w-4" />
            NOA Intelligence
          </TabsTrigger>
          <TabsTrigger 
            value="firecrawl" 
            className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <Search className="h-4 w-4" />
            Firecrawl Intelligence
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
          <div className="space-y-6">
            <ManufacturerNOASearch />
            <NOACSVImporter />
            <BatchProductSourcing />
          </div>
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
        <TabsContent value="permit-packets" className="mt-4">
          <div className="space-y-6">
            {/* Upload Mode Toggle */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-medium text-muted-foreground">Upload Mode:</span>
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <Button
                  variant={trainingMode === "batch" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTrainingMode("batch")}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Batch Upload
                </Button>
                <Button
                  variant={trainingMode === "single" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTrainingMode("single")}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Single Upload
                </Button>
              </div>
            </div>

            {/* Conditional Uploader */}
            {trainingMode === "batch" ? (
              <PermitBatchUploader 
                onBatchComplete={() => setTrainingRefresh(prev => prev + 1)} 
              />
            ) : (
              <PermitTrainingUploader 
                onUploadComplete={() => setTrainingRefresh(prev => prev + 1)} 
              />
            )}
            
            <TrainingSamplesTable refreshTrigger={trainingRefresh} />
          </div>
        </TabsContent>
        <TabsContent value="books-guides" className="mt-4">
          <PermitBooksManager />
        </TabsContent>
        <TabsContent value="noa-intelligence" className="mt-4">
          <div className="space-y-6">
            <NOABulkManager />
            <NOAUploadQueue />
          </div>
        </TabsContent>
        <TabsContent value="firecrawl" className="mt-4">
          <div className="space-y-4">
            <Tabs defaultValue="noa-search" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="noa-search" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  NOA Search
                </TabsTrigger>
                <TabsTrigger value="building-depts" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Building Dept Crawler
                </TabsTrigger>
                <TabsTrigger value="discovered-docs" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Discovered Documents
                </TabsTrigger>
                <TabsTrigger value="crawl-jobs" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Crawl Jobs
                </TabsTrigger>
              </TabsList>
              <TabsContent value="noa-search"><NoaSearchTab /></TabsContent>
              <TabsContent value="building-depts"><BuildingDeptCrawlerTab /></TabsContent>
              <TabsContent value="discovered-docs"><DiscoveredDocumentsTab /></TabsContent>
              <TabsContent value="crawl-jobs"><CrawlJobsTab /></TabsContent>
            </Tabs>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AITrainingCenter;
