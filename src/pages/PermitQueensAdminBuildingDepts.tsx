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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-amber-500" />
              <div>
                <h1 className="text-xl font-bold text-white">Permit Queens</h1>
                <p className="text-sm text-amber-500 flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> Building Departments
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate("/permit-queens/admin/dashboard")} 
                className="border-slate-700 text-slate-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button variant="outline" onClick={handleSignOut} className="border-slate-700 text-slate-300">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800 border-slate-700 mb-6">
            <TabsTrigger value="list" className="data-[state=active]:bg-amber-600">
              <Building2 className="h-4 w-4 mr-2" />
              All Departments
            </TabsTrigger>
            {selectedDept && (
              <TabsTrigger value="details" className="data-[state=active]:bg-amber-600">
                <FileText className="h-4 w-4 mr-2" />
                {selectedDept.city || selectedDept.county} Details
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="list">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-amber-500" />
                    <div>
                      <p className="text-2xl font-bold text-white">{totalDepts}</p>
                      <p className="text-sm text-slate-400">Total Departments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold text-white">{hvhzDepts}</p>
                      <p className="text-sm text-slate-400">HVHZ Zones</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold text-white">{deptWithZips}</p>
                      <p className="text-sm text-slate-400">With ZIP Codes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Globe className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold text-white">{totalZips}</p>
                      <p className="text-sm text-slate-400">ZIP Codes Mapped</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="bg-slate-900 border-slate-800 mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search by name, county, city, or ZIP..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                  <Select value={countyFilter} onValueChange={setCountyFilter}>
                    <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="County" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                      <SelectItem value="all">All Counties</SelectItem>
                      {counties.map(county => (
                        <SelectItem key={county} value={county}>{county}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={hvhzFilter} onValueChange={setHvhzFilter}>
                    <SelectTrigger className="w-[150px] bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="HVHZ Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all">All Zones</SelectItem>
                      <SelectItem value="hvhz">HVHZ Only</SelectItem>
                      <SelectItem value="non-hvhz">Non-HVHZ</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddDepartment} className="bg-amber-600 hover:bg-amber-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Department
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Departments Table */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Building Departments ({filteredDepartments.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-slate-400">Loading departments...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-800">
                          <TableHead className="text-slate-400">County</TableHead>
                          <TableHead className="text-slate-400">City/Dept</TableHead>
                          <TableHead className="text-slate-400">Contact</TableHead>
                          <TableHead className="text-slate-400">ZIP Codes</TableHead>
                          <TableHead className="text-slate-400">Status</TableHead>
                          <TableHead className="text-slate-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDepartments.map((dept) => (
                          <TableRow key={dept.id} className="border-slate-800">
                            <TableCell className="text-white font-medium">{dept.county}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-white">{dept.city || 'County-wide'}</p>
                                <p className="text-sm text-slate-400">{dept.name}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {dept.phone && (
                                  <p className="text-sm text-slate-300 flex items-center gap-1">
                                    <Phone className="h-3 w-3" /> {dept.phone}
                                  </p>
                                )}
                                {dept.website && (
                                  <a href={dept.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline flex items-center gap-1">
                                    <Globe className="h-3 w-3" /> Website
                                  </a>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {dept.zip_codes && dept.zip_codes.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {dept.zip_codes.slice(0, 3).map(zip => (
                                    <Badge key={zip} variant="secondary" className="bg-slate-700 text-xs">
                                      {zip}
                                    </Badge>
                                  ))}
                                  {dept.zip_codes.length > 3 && (
                                    <Badge variant="secondary" className="bg-slate-700 text-xs">
                                      +{dept.zip_codes.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-500 text-sm">None</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {dept.is_hvhz && (
                                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                  HVHZ
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEditDepartment(dept)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleViewDetails(dept)} className="text-amber-400 hover:text-amber-300">
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
              <div className="space-y-6">
                {/* Department Info Header */}
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-white">{selectedDept.name}</h2>
                        <p className="text-slate-400">
                          {selectedDept.city ? `${selectedDept.city}, ` : ''}{selectedDept.county} County
                        </p>
                        <div className="flex gap-2 mt-2">
                          {selectedDept.is_hvhz && (
                            <Badge className="bg-orange-500/20 text-orange-400">HVHZ Zone</Badge>
                          )}
                          <Badge variant="secondary" className="bg-slate-700">
                            {selectedDept.zip_codes?.length || 0} ZIP codes
                          </Badge>
                        </div>
                      </div>
                      <Button onClick={() => handleEditDepartment(selectedDept)} variant="outline" className="border-slate-600">
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Info
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      {selectedDept.phone && (
                        <div>
                          <p className="text-sm text-slate-400">Phone</p>
                          <p className="text-white">{selectedDept.phone}</p>
                        </div>
                      )}
                      {selectedDept.email && (
                        <div>
                          <p className="text-sm text-slate-400">Email</p>
                          <p className="text-white">{selectedDept.email}</p>
                        </div>
                      )}
                      {selectedDept.hours && (
                        <div>
                          <p className="text-sm text-slate-400">Hours</p>
                          <p className="text-white">{selectedDept.hours}</p>
                        </div>
                      )}
                      {selectedDept.processing_time && (
                        <div>
                          <p className="text-sm text-slate-400">Processing Time</p>
                          <p className="text-white">{selectedDept.processing_time}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Documents Section */}
                <DepartmentDocuments 
                  departmentId={selectedDept.id} 
                  departmentName={selectedDept.city || selectedDept.county} 
                />

                {/* Required Info Checklist */}
                <RequiredInfoChecklist 
                  departmentId={selectedDept.id} 
                  departmentName={selectedDept.city || selectedDept.county} 
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Department Editor Dialog */}
      <DepartmentEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveDepartment}
        department={editingDept}
      />
    </div>
  );
}
