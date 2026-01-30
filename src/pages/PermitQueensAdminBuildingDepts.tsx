import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Crown, ShieldCheck, LogOut, Search, Building2, MapPin, Phone, Globe, Plus, Edit2, FileText, ClipboardList, ArrowLeft, AlertTriangle } from "lucide-react";
import { DepartmentEditor } from "@/components/permit-queens/admin/DepartmentEditor";
import { DepartmentDocuments } from "@/components/permit-queens/admin/DepartmentDocuments";
import { RequiredInfoChecklist } from "@/components/permit-queens/admin/RequiredInfoChecklist";
import { StatCard3D } from "@/components/crm-ui";

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
  zip_codes: string[];
  is_hvhz: boolean;
  submission_method: string;
  processing_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function PermitQueensAdminBuildingDepts() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [departments, setDepartments] = useState<BuildingDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [countyFilter, setCountyFilter] = useState("all");
  const [hvhzFilter, setHvhzFilter] = useState("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<BuildingDepartment | null>(null);
  const [selectedDept, setSelectedDept] = useState<BuildingDepartment | null>(null);
  const [activeTab, setActiveTab] = useState("list");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await checkAdminAccess(session.user.id);
      } else {
        navigate("/permit-queens/admin/auth");
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        await checkAdminAccess(session.user.id);
      } else {
        navigate("/permit-queens/admin/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminAccess = async (userId: string) => {
    const { data: adminData } = await supabase
      .from("permit_admins")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!adminData) {
      toast.error("You don't have admin access.");
      await supabase.auth.signOut();
      navigate("/permit-queens/admin/auth");
      return;
    }

    await fetchDepartments();
  };

  const fetchDepartments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("permit_building_departments")
      .select("*")
      .order("county")
      .order("city", { nullsFirst: true });

    if (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to load departments");
    } else {
      setDepartments(data || []);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleAddDepartment = () => {
    setEditingDept(null);
    setEditorOpen(true);
  };

  const handleEditDepartment = (dept: BuildingDepartment) => {
    setEditingDept(dept);
    setEditorOpen(true);
  };

  const handleSaveDepartment = async (deptData: any) => {
    if (editingDept?.id) {
      const { error } = await supabase
        .from("permit_building_departments")
        .update({
          ...deptData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingDept.id);

      if (error) throw error;
      toast.success("Department updated");
    } else {
      const { error } = await supabase
        .from("permit_building_departments")
        .insert(deptData);

      if (error) throw error;
      toast.success("Department added");
    }

    await fetchDepartments();
  };

  const handleViewDetails = (dept: BuildingDepartment) => {
    setSelectedDept(dept);
    setActiveTab("details");
  };

  // Filter departments
  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = search === "" ||
      dept.name.toLowerCase().includes(search.toLowerCase()) ||
      dept.county.toLowerCase().includes(search.toLowerCase()) ||
      dept.city?.toLowerCase().includes(search.toLowerCase()) ||
      dept.zip_codes?.some(z => z.includes(search));

    const matchesCounty = countyFilter === "all" || dept.county === countyFilter;
    const matchesHvhz = hvhzFilter === "all" || 
      (hvhzFilter === "hvhz" && dept.is_hvhz) ||
      (hvhzFilter === "non-hvhz" && !dept.is_hvhz);

    return matchesSearch && matchesCounty && matchesHvhz;
  });

  // Get unique counties
  const counties = [...new Set(departments.map(d => d.county))].sort();

  // Stats
  const totalDepts = departments.length;
  const hvhzDepts = departments.filter(d => d.is_hvhz).length;
  const deptWithZips = departments.filter(d => d.zip_codes && d.zip_codes.length > 0).length;
  const totalZips = departments.reduce((sum, d) => sum + (d.zip_codes?.length || 0), 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Crown className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Permit Expediting</h1>
                <p className="text-sm text-primary flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> Building Departments
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate("/permit-queens/admin/dashboard")} 
                className="border-border text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button variant="outline" onClick={handleSignOut} className="border-border text-foreground">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted border-border mb-6">
            <TabsTrigger value="list" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Building2 className="h-4 w-4 mr-2" />
              All Departments
            </TabsTrigger>
            {selectedDept && (
              <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileText className="h-4 w-4 mr-2" />
                {selectedDept.city || selectedDept.county} Details
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="list">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard3D
                title="Total Departments"
                value={totalDepts}
                icon={Building2}
                color="primary"
              />
              <StatCard3D
                title="HVHZ Zones"
                value={hvhzDepts}
                icon={AlertTriangle}
                color="warning"
              />
              <StatCard3D
                title="With ZIP Codes"
                value={deptWithZips}
                icon={MapPin}
                color="success"
              />
              <StatCard3D
                title="ZIP Codes Mapped"
                value={totalZips}
                icon={Globe}
                color="primary"
              />
            </div>

            {/* Filters */}
            <Card className="border border-border mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, county, city, or ZIP..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 bg-background border-border text-foreground"
                      />
                    </div>
                  </div>
                  <Select value={countyFilter} onValueChange={setCountyFilter}>
                    <SelectTrigger className="w-[180px] bg-background border-border text-foreground">
                      <SelectValue placeholder="County" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border max-h-60">
                      <SelectItem value="all">All Counties</SelectItem>
                      {counties.map(county => (
                        <SelectItem key={county} value={county}>{county}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={hvhzFilter} onValueChange={setHvhzFilter}>
                    <SelectTrigger className="w-[150px] bg-background border-border text-foreground">
                      <SelectValue placeholder="HVHZ Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="all">All Zones</SelectItem>
                      <SelectItem value="hvhz">HVHZ Only</SelectItem>
                      <SelectItem value="non-hvhz">Non-HVHZ</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddDepartment} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Department
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Departments Table */}
            <Card className="border border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center justify-between">
                  <span>Building Departments ({filteredDepartments.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading departments...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead className="text-muted-foreground">County</TableHead>
                          <TableHead className="text-muted-foreground">City/Dept</TableHead>
                          <TableHead className="text-muted-foreground">Contact</TableHead>
                          <TableHead className="text-muted-foreground">ZIP Codes</TableHead>
                          <TableHead className="text-muted-foreground">Status</TableHead>
                          <TableHead className="text-muted-foreground">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDepartments.map((dept) => (
                          <TableRow key={dept.id} className="border-border">
                            <TableCell className="text-foreground font-medium">{dept.county}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-foreground">{dept.city || 'County-wide'}</p>
                                <p className="text-sm text-muted-foreground">{dept.name}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {dept.phone && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" /> {dept.phone}
                                  </p>
                                )}
                                {dept.website && (
                                  <a href={dept.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                                    <Globe className="h-3 w-3" /> Website
                                  </a>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {dept.zip_codes && dept.zip_codes.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {dept.zip_codes.slice(0, 3).map(zip => (
                                    <Badge key={zip} variant="secondary" className="bg-muted text-muted-foreground text-xs">
                                      {zip}
                                    </Badge>
                                  ))}
                                  {dept.zip_codes.length > 3 && (
                                    <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs">
                                      +{dept.zip_codes.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">None</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {dept.is_hvhz && (
                                <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                                  HVHZ
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEditDepartment(dept)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleViewDetails(dept)} className="text-primary hover:text-primary/80">
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details">
            {selectedDept && (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Department Info */}
                <Card className="border border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {selectedDept.city || selectedDept.county} Building Department
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">County</p>
                        <p className="font-medium text-foreground">{selectedDept.county}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">City</p>
                        <p className="font-medium text-foreground">{selectedDept.city || 'County-wide'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium text-foreground">{selectedDept.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">HVHZ Status</p>
                        {selectedDept.is_hvhz ? (
                          <Badge className="bg-orange-500/10 text-orange-600">HVHZ Zone</Badge>
                        ) : (
                          <Badge variant="secondary">Standard</Badge>
                        )}
                      </div>
                    </div>
                    {selectedDept.website && (
                      <div>
                        <p className="text-sm text-muted-foreground">Website</p>
                        <a href={selectedDept.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {selectedDept.website}
                        </a>
                      </div>
                    )}
                    {selectedDept.notes && (
                      <div>
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="text-foreground">{selectedDept.notes}</p>
                      </div>
                    )}
                    <Button 
                      variant="outline" 
                      onClick={() => handleEditDepartment(selectedDept)}
                      className="w-full"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Department
                    </Button>
                  </CardContent>
                </Card>

                {/* Documents and Checklists */}
                <div className="space-y-6">
                  <DepartmentDocuments departmentId={selectedDept.id} departmentName={selectedDept.city || selectedDept.county} />
                  <RequiredInfoChecklist departmentId={selectedDept.id} departmentName={selectedDept.city || selectedDept.county} />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Department Editor Dialog */}
      <DepartmentEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        department={editingDept}
        onSave={handleSaveDepartment}
      />
    </div>
  );
}
