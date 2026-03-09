import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus, Shield, Mail } from "lucide-react";
import { toast } from "sonner";

const mockUsers = [
  { id: "1", name: "John Smith", email: "john@company.com", role: "Company Admin", status: "active", lastLogin: "2026-03-09" },
  { id: "2", name: "Sarah Johnson", email: "sarah@company.com", role: "Sales Rep", status: "active", lastLogin: "2026-03-08" },
  { id: "3", name: "Mike Davis", email: "mike@company.com", role: "Estimator", status: "active", lastLogin: "2026-03-07" },
  { id: "4", name: "Emily Chen", email: "emily@company.com", role: "Project Manager", status: "invited", lastLogin: "—" },
];

export function UsersSettings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Team Members</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage who has access to your CRM</p>
        </div>
        <Button onClick={() => toast.info("Invite user dialog coming soon")} className="gap-2"><UserPlus className="h-4 w-4" />Invite User</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      {user.role === "Company Admin" && <Shield className="h-3 w-3" />}
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === "active" ? "default" : "secondary"}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{user.lastLogin}</TableCell>
                  <TableCell>
                    {user.status === "invited" ? (
                      <Button variant="ghost" size="sm" onClick={() => toast.info("Resending invite...")}><Mail className="h-4 w-4" /></Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => toast.info("Edit user coming soon")}>Edit</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Roles & Permissions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { role: "Company Admin", desc: "Full access to all settings, billing, and team management" },
            { role: "Sales Rep", desc: "Manage contacts, leads, create estimates, and track commissions" },
            { role: "Estimator", desc: "Create and manage estimates, view materials and pricing" },
            { role: "Project Manager", desc: "Manage jobs, schedules, inspections, and field teams" },
            { role: "Read Only", desc: "View-only access to dashboards and reports" },
          ].map(r => (
            <div key={r.role} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <p className="font-medium text-sm">{r.role}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.info("Role editor coming soon")}>Configure</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
