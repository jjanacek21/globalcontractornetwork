import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useHomeownerProjects, useProjectMessages, HomeownerProject } from "@/hooks/useHomeownerProjects";
import { 
  Home, ArrowRight, LogOut, Plus, MessageSquare, Calendar,
  ClipboardList, Send, Loader2, MapPin, DollarSign, Clock,
  CheckCircle, AlertCircle, FileText, User
} from "lucide-react";
import gcnLogo from "@/assets/gcn-logo.jpg";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

const statusColors: Record<string, string> = {
  quote_requested: "bg-blue-100 text-blue-800",
  quoted: "bg-purple-100 text-purple-800",
  scheduled: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  quote_requested: "Quote Requested",
  quoted: "Quoted",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const HomeownerDashboard = () => {
  const [profile, setProfile] = useState<{ first_name: string; last_name: string; email: string } | null>(null);
  const [selectedProject, setSelectedProject] = useState<HomeownerProject | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const { projects, loading } = useHomeownerProjects();
  const { messages, sendMessage } = useProjectMessages(selectedProject?.id || null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedProject) return;
    setSendingMessage(true);
    
    await sendMessage(messageInput, "homeowner");
    setMessageInput("");
    setSendingMessage(false);
  };

  const activeProjects = projects.filter(p => 
    ["quote_requested", "quoted", "scheduled", "in_progress"].includes(p.status)
  );
  const completedProjects = projects.filter(p => p.status === "completed");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Projects | Global Contractor Network</title>
        <meta name="description" content="View and manage your home improvement projects, quotes, and communicate with contractors." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full bg-background border-b">
          <div className="container flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src={gcnLogo} alt="GCN Logo" className="h-10 w-auto rounded-lg" />
              <div className="flex flex-col">
                <span className="text-lg font-bold">Global Contractor Network</span>
                <span className="text-xs text-muted-foreground">Homeowner Dashboard</span>
              </div>
            </Link>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{profile?.first_name} {profile?.last_name}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <main className="container py-8 space-y-8">
          {/* Welcome & Quick Actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {profile?.first_name}!</h1>
              <p className="text-muted-foreground">Manage your projects and communicate with contractors</p>
            </div>
            <Button onClick={() => navigate("/get-quote")} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Get New Quote
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Projects</p>
                    <p className="text-2xl font-bold">{activeProjects.length}</p>
                  </div>
                  <ClipboardList className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Quotes</p>
                    <p className="text-2xl font-bold">
                      {projects.filter(p => p.status === "quote_requested").length}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled</p>
                    <p className="text-2xl font-bold">
                      {projects.filter(p => p.status === "scheduled").length}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-yellow-500/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{completedProjects.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500/20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Homeowner Tools Section */}
          <div className="rounded-2xl p-6 md:p-8 bg-slate-900">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[hsl(45,100%,51%)]/20 flex items-center justify-center">
                <Home className="h-5 w-5 text-[hsl(45,100%,51%)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Homeowner Tools</h2>
                <p className="text-sm text-white/60">Manage Your Projects</p>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-3 gap-4">
              {/* My Projects Card */}
              <div 
                className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[hsl(45,100%,51%)]/30 transition-all cursor-pointer"
                onClick={() => document.getElementById('projects-tabs')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[hsl(45,100%,51%)]/20 flex items-center justify-center">
                    <ClipboardList className="h-6 w-6 text-[hsl(45,100%,51%)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">My Projects</h3>
                    <p className="text-sm text-white/60">Track & manage your projects</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-white/40" />
                </div>
              </div>

              {/* My Profile Card */}
              <Link to="/homeowner-profile" className="group">
                <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[hsl(45,100%,51%)]/30 transition-all h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[hsl(45,100%,51%)]/20 flex items-center justify-center">
                      <User className="h-6 w-6 text-[hsl(45,100%,51%)]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white group-hover:text-[hsl(45,100%,51%)] transition-colors">
                        My Profile
                      </h3>
                      <p className="text-sm text-white/60">View all your data & activity</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-white/40 group-hover:text-[hsl(45,100%,51%)] group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>

              {/* My Messages Card */}
              <Link to="/homeowner-messages" className="group">
                <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[hsl(45,100%,51%)]/30 transition-all h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[hsl(45,100%,51%)]/20 flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-[hsl(45,100%,51%)]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white group-hover:text-[hsl(45,100%,51%)] transition-colors">
                        My Messages
                      </h3>
                      <p className="text-sm text-white/60">Chat with contractors</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-white/40 group-hover:text-[hsl(45,100%,51%)] group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="active" className="space-y-6" id="projects-tabs">
            <TabsList>
              <TabsTrigger value="active">Active Projects</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeProjects.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Home className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No active projects</h3>
                    <p className="text-muted-foreground mb-4">Start a new project to get instant quotes</p>
                    <Button onClick={() => navigate("/get-quote")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Get Quote
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {activeProjects.map((project) => (
                    <Card key={project.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className={statusColors[project.status]}>
                                {statusLabels[project.status]}
                              </Badge>
                              <Badge variant="outline">{project.service_type}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span className="text-sm">{project.property_address}</span>
                            </div>
                            {project.ai_estimate_low && project.ai_estimate_high && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-primary" />
                                <span className="font-semibold">
                                  ${project.ai_estimate_low.toLocaleString()} - ${project.ai_estimate_high.toLocaleString()}
                                </span>
                                {project.official_quote && (
                                  <Badge variant="secondary">
                                    Official: ${project.official_quote.toLocaleString()}
                                  </Badge>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              Created {new Date(project.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {project.assigned_contractor_id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedProject(project)}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Message
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedProject(project)}
                            >
                              View Details
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedProjects.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No completed projects yet</h3>
                    <p className="text-muted-foreground">Your completed projects will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {completedProjects.map((project) => (
                    <Card key={project.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-800">Completed</Badge>
                              <Badge variant="outline">{project.service_type}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{project.property_address}</p>
                            {project.official_quote && (
                              <p className="font-semibold">
                                Final: ${project.official_quote.toLocaleString()}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm">
                            View Details
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="messages" className="space-y-4">
              <Card className="text-center py-12">
                <CardContent>
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Project Messages</h3>
                  <p className="text-muted-foreground">
                    Select a project to view or send messages to your contractor
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        {/* Project Detail Sheet */}
        <Sheet open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
          <SheetContent className="w-full sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Project Details</SheetTitle>
            </SheetHeader>
            
            {selectedProject && (
              <div className="mt-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[selectedProject.status]}>
                      {statusLabels[selectedProject.status]}
                    </Badge>
                    <Badge variant="outline">{selectedProject.service_type}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedProject.property_address}</span>
                    </div>
                    {selectedProject.ai_estimate_low && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="font-semibold">
                          ${selectedProject.ai_estimate_low.toLocaleString()} - ${selectedProject.ai_estimate_high?.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {selectedProject.contractor && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Assigned Contractor</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-semibold">{selectedProject.contractor.company_name}</p>
                        {selectedProject.contractor.phone && (
                          <p className="text-sm text-muted-foreground">{selectedProject.contractor.phone}</p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Messages */}
                {selectedProject.assigned_contractor_id && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Messages</h3>
                    <ScrollArea className="h-64 border rounded-lg p-4">
                      {messages.length === 0 ? (
                        <p className="text-center text-muted-foreground text-sm">
                          No messages yet. Start the conversation!
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`p-3 rounded-lg ${
                                msg.sender_type === "homeowner"
                                  ? "bg-primary text-primary-foreground ml-8"
                                  : "bg-muted mr-8"
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(msg.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      />
                      <Button onClick={handleSendMessage} disabled={sendingMessage}>
                        {sendingMessage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default HomeownerDashboard;
