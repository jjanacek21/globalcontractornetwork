import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Building2, FileText, History } from 'lucide-react';
import NoaSearchTab from '@/components/admin/firecrawl/NoaSearchTab';
import BuildingDeptCrawlerTab from '@/components/admin/firecrawl/BuildingDeptCrawlerTab';
import DiscoveredDocumentsTab from '@/components/admin/firecrawl/DiscoveredDocumentsTab';
import CrawlJobsTab from '@/components/admin/firecrawl/CrawlJobsTab';

const AdminFirecrawl = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Firecrawl Intelligence Center</h1>
          <p className="text-muted-foreground mt-1">Search NOAs, crawl building departments, and discover permit documents</p>
        </div>

        <Tabs defaultValue="noa-search" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="noa-search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              NOA Search
            </TabsTrigger>
            <TabsTrigger value="building-depts" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Building Dept Crawler
            </TabsTrigger>
            <TabsTrigger value="discovered-docs" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Discovered Documents
            </TabsTrigger>
            <TabsTrigger value="crawl-jobs" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Crawl Jobs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="noa-search"><NoaSearchTab /></TabsContent>
          <TabsContent value="building-depts"><BuildingDeptCrawlerTab /></TabsContent>
          <TabsContent value="discovered-docs"><DiscoveredDocumentsTab /></TabsContent>
          <TabsContent value="crawl-jobs"><CrawlJobsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminFirecrawl;
