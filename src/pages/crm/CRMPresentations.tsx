import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Plus, Search, Edit, Play, Share2, Copy, Trash2, Presentation } from "lucide-react";

export default function CRMPresentations() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Presentations</h1>
          <p className="text-muted-foreground">Create and manage sales presentations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Sparkles className="mr-2 h-4 w-4" />AI Generate</Button>
          <Button size="sm" className="bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,30%)] text-white"><Plus className="mr-2 h-4 w-4" />Create Blank</Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search presentations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All Presentations</TabsTrigger>
          <TabsTrigger value="mine">My Presentations</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Presentation className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground mb-4">No presentations yet. Create your first presentation to get started.</p>
            <Button size="sm" className="bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,30%)] text-white"><Plus className="mr-2 h-4 w-4" />Create Presentation</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
