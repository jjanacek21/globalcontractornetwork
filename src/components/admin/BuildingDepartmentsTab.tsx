import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Loader2, MapPin, FileText, CheckSquare, Edit, Building2, Phone, Globe } from "lucide-react";
import { DepartmentEditor } from "@/components/permit-queens/admin/DepartmentEditor";
import { DepartmentDocuments } from "@/components/permit-queens/admin/DepartmentDocuments";
import { RequiredInfoChecklist } from "@/components/permit-queens/admin/RequiredInfoChecklist";

interface BuildingDepartment {
  id: string;
  county: string;
  city: string | null;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  fax: string | null;
  website: string | null;
  portal_url: string | null;
  hours: string | null;
  jurisdiction_type: string | null;
  zip_codes: string[] | null;
  is_hvhz: boolean | null;
  submission_method: string | null;
  processing_time: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const BuildingDepartmentsTab = () => {
  const [departments, setDepartments] = useState<BuildingDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [countyFilter, setCountyFilter] = useState("all");
  const [hvhzFilter, setHvhzFilter] = useState("all");
  
  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<BuildingDepartment | null>(null);
  
  // Details dialog state
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsDepartment, setDetailsDepartment] = useState<BuildingDepartment | null>(null);
  const [detailsTab, setDetailsTab] = useState("documents");
  
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("permit_building_departments")
        .select("*")
        .order("county", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast({
        title: "Error",
        description: "Failed to load building departments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepartment = () => {
    setSelectedDepartment(null);
    setEditorOpen(true);
  };

  const handleEditDepartment = (dept: BuildingDepartment) => {
    setSelectedDepartment(dept);
    setEditorOpen(true);
  };

  const handleViewDetails = (dept: BuildingDepartment) => {
    setDetailsDepartment(dept);
    setDetailsTab("documents");
    setDetailsOpen(true);
  };

  const handleSaveDepartment = async (data: Partial<BuildingDepartment>) => {
    try {
      if (selectedDepartment) {
        // Update existing
        const { error } = await supabase
          .from("permit_building_departments")
          .update(data)
          .eq("id", selectedDepartment.id);

        if (error) throw error;
        toast({ title: "Success", description: "Department updated successfully" });
      } else {
        // Create new - ensure required fields
        if (!data.county || !data.name) {
          toast({ title: "Error", description: "County and name are required", variant: "destructive" });
          return;
        }
        const { error } = await supabase
          .from("permit_building_departments")
          .insert([data as { county: string; name: string } & Partial<BuildingDepartment>]);

        if (error) throw error;
        toast({ title: "Success", description: "Department created successfully" });
      }

      setEditorOpen(false);
      fetchDepartments();
    } catch (error) {
      console.error("Error saving department:", error);
      toast({
        title: "Error",
        description: "Failed to save department",
        variant: "destructive",
      });
    }
  };

  // Get unique counties for filter
  const counties = [...new Set(departments.map(d => d.county))].sort();

  // Filter departments
  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = 
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.county.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.zip_codes?.some(z => z.includes(searchQuery));
    
    const matchesCounty = countyFilter === "all" || dept.county === countyFilter;
    const matchesHvhz = hvhzFilter === "all" || 
      (hvhzFilter === "hvhz" && dept.is_hvhz) ||
      (hvhzFilter === "non-hvhz" && !dept.is_hvhz);
    
    return matchesSearch && matchesCounty && matchesHvhz;
  });

  // Stats
  const totalDepartments = departments.length;
  const hvhzCount = departments.filter(d => d.is_hvhz).length;
  const withZipCodes = departments.filter(d => d.zip_codes && d.zip_codes.length > 0).length;
  const totalZipCodes = departments.reduce((acc, d) => acc + (d.zip_codes?.length || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Departments</p>
                <p className="text-2xl font-bold">{totalDepartments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <MapPin className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">HVHZ Zones</p>
                <p className="text-2xl font-bold">{hvhzCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckSquare className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">With ZIP Codes</p>
                <p className="text-2xl font-bold">{withZipCodes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total ZIP Codes</p>
                <p className="text-2xl font-bold">{totalZipCodes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, county, city, or ZIP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={countyFilter} onValueChange={setCountyFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by county" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Counties</SelectItem>
            {counties.map(county => (
              <SelectItem key={county} value={county}>{county}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={hvhzFilter} onValueChange={setHvhzFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="HVHZ Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Zones</SelectItem>
            <SelectItem value="hvhz">HVHZ Only</SelectItem>
            <SelectItem value="non-hvhz">Non-HVHZ</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleAddDepartment} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </div>

      {/* Departments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Building Departments ({filteredDepartments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>County</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>HVHZ</TableHead>
                  <TableHead>ZIP Codes</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium max-w-[200px]">
                      <div className="truncate">{dept.name}</div>
                      {dept.jurisdiction_type && (
                        <span className="text-xs text-muted-foreground">
                          {dept.jurisdiction_type}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{dept.county}</TableCell>
                    <TableCell>{dept.city || "-"}</TableCell>
                    <TableCell>
                      {dept.is_hvhz ? (
                        <Badge className="bg-orange-100 text-orange-800">HVHZ</Badge>
                      ) : (
                        <Badge variant="secondary">Non-HVHZ</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {dept.zip_codes?.length || 0} ZIPs
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {dept.phone && (
                          <a href={`tel:${dept.phone}`} className="text-muted-foreground hover:text-primary">
                            <Phone className="h-4 w-4" />
                          </a>
                        )}
                        {dept.website && (
                          <a href={dept.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                            <Globe className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(dept)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditDepartment(dept)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredDepartments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No departments found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Department Editor Dialog */}
      <DepartmentEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveDepartment}
        department={selectedDepartment}
      />

      {/* Department Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {detailsDepartment?.name}
            </DialogTitle>
          </DialogHeader>
          
          {detailsDepartment && (
            <Tabs value={detailsTab} onValueChange={setDetailsTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="documents" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Required Documents
                </TabsTrigger>
                <TabsTrigger value="checklist" className="gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Info Checklist
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="documents" className="mt-4">
                <DepartmentDocuments
                  departmentId={detailsDepartment.id}
                  departmentName={detailsDepartment.name}
                />
              </TabsContent>
              
              <TabsContent value="checklist" className="mt-4">
                <RequiredInfoChecklist
                  departmentId={detailsDepartment.id}
                  departmentName={detailsDepartment.name}
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuildingDepartmentsTab;
