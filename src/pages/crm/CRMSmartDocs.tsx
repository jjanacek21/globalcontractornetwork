import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Plus, FileText } from "lucide-react";

export default function CRMSmartDocs() {
  const [tab, setTab] = useState("smart-docs");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Smart Docs</h1>
          <p className="text-muted-foreground">Create and manage intelligent document templates with dynamic tags</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Sparkles className="mr-2 h-4 w-4" />Professional Templates</Button>
          <Button size="sm" className="bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,30%)] text-white"><Plus className="mr-2 h-4 w-4" />New Template</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="smart-docs">Smart Docs</TabsTrigger>
          <TabsTrigger value="template-library">Template Library</TabsTrigger>
          <TabsTrigger value="company-docs">Company Docs</TabsTrigger>
          <TabsTrigger value="folders">Folders</TabsTrigger>
        </TabsList>

        <TabsContent value="smart-docs" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold text-lg mb-1">Tagged Documents</h2>
              <p className="text-sm text-muted-foreground mb-6">Company documents with smart tag placements. These can be applied to leads/projects with auto-filled data.</p>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">No tagged documents yet. Create your first smart document template to get started.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="template-library" className="mt-4">
          <Card><CardContent className="p-6 text-center py-12 text-muted-foreground">Template library coming soon.</CardContent></Card>
        </TabsContent>

        <TabsContent value="company-docs" className="mt-4">
          <Card><CardContent className="p-6 text-center py-12 text-muted-foreground">Company documents coming soon.</CardContent></Card>
        </TabsContent>

        <TabsContent value="folders" className="mt-4">
          <Card><CardContent className="p-6 text-center py-12 text-muted-foreground">Document folders coming soon.</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
