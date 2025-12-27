import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2, Loader2, ShieldCheck, User } from "lucide-react";
import { format } from "date-fns";

interface SuperAdmin {
  id: string;
  user_id: string;
  created_at: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

const SuperAdminsTable = () => {
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Add admin dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

  // Remove admin dialog state
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [adminToRemove, setAdminToRemove] = useState<SuperAdmin | null>(null);
  const [removing, setRemoving] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentUserAndAdmins();
  }, []);

  const fetchCurrentUserAndAdmins = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }

      const { data: admins, error } = await supabase
        .from("super_admins")
        .select("id, user_id, created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profile info for each admin
      const adminsWithProfiles: SuperAdmin[] = [];
      for (const admin of admins || []) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, first_name, last_name")
          .eq("id", admin.user_id)
          .maybeSingle();

        adminsWithProfiles.push({
          ...admin,
          email: profile?.email || "Unknown",
          first_name: profile?.first_name || "",
          last_name: profile?.last_name || "",
        });
      }

      setSuperAdmins(adminsWithProfiles);
    } catch (error) {
      console.error("Error fetching super admins:", error);
      toast({
        title: "Error",
        description: "Failed to load super admins",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .or(`email.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;

      // Filter out users who are already super admins
      const existingAdminIds = superAdmins.map((a) => a.user_id);
      const filteredResults = (data || []).filter(
        (user) => !existingAdminIds.includes(user.id)
      );

      setSearchResults(filteredResults as UserProfile[]);
    } catch (error) {
      console.error("Error searching users:", error);
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (addDialogOpen && searchQuery.trim().length >= 2) {
        searchUsers();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, addDialogOpen]);

  const handleAddAdmin = async (user: UserProfile) => {
    setAdding(true);
    try {
      const { error } = await supabase.from("super_admins").insert({
        user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Admin Added",
        description: `${user.email} is now a super admin`,
      });

      setAddDialogOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      await fetchCurrentUserAndAdmins();
    } catch (error: any) {
      console.error("Error adding super admin:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add super admin",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAdmin = async () => {
    if (!adminToRemove) return;

    // Prevent removing last admin
    if (superAdmins.length <= 1) {
      toast({
        title: "Cannot Remove",
        description: "You cannot remove the last super admin",
        variant: "destructive",
      });
      return;
    }

    // Prevent removing yourself
    if (adminToRemove.user_id === currentUserId) {
      toast({
        title: "Cannot Remove",
        description: "You cannot remove your own super admin access",
        variant: "destructive",
      });
      return;
    }

    setRemoving(true);
    try {
      const { error } = await supabase
        .from("super_admins")
        .delete()
        .eq("id", adminToRemove.id);

      if (error) throw error;

      toast({
        title: "Admin Removed",
        description: `${adminToRemove.email} is no longer a super admin`,
      });

      setRemoveDialogOpen(false);
      setAdminToRemove(null);
      await fetchCurrentUserAndAdmins();
    } catch (error: any) {
      console.error("Error removing super admin:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove super admin",
        variant: "destructive",
      });
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Super Admins</h3>
          <p className="text-sm text-muted-foreground">
            Manage users with full administrative access
          </p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Admin
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {superAdmins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No super admins found
                </TableCell>
              </TableRow>
            ) : (
              superAdmins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {admin.first_name || admin.last_name
                            ? `${admin.first_name || ""} ${admin.last_name || ""}`.trim()
                            : "—"}
                        </p>
                        {admin.user_id === currentUserId && (
                          <span className="text-xs text-muted-foreground">(you)</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {admin.created_at
                      ? format(new Date(admin.created_at), "MMM d, yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {admin.user_id !== currentUserId && superAdmins.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setAdminToRemove(admin);
                          setRemoveDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Admin Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Super Admin</DialogTitle>
            <DialogDescription>
              Search for an existing user to grant super admin access
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {searching && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!searching && searchResults.length > 0 && (
              <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 hover:bg-muted/50 cursor-pointer flex items-center justify-between"
                    onClick={() => handleAddAdmin(user)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {user.first_name || user.last_name
                            ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                            : "No name"}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    {adding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No users found matching "{searchQuery}"
              </p>
            )}

            {!searching && searchQuery.length < 2 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Type at least 2 characters to search
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Admin Confirmation */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Super Admin Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove super admin access for{" "}
              <strong>{adminToRemove?.email}</strong>? They will no longer be able
              to access the Master Admin Portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAdmin}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Access"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SuperAdminsTable;
