import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Shield, Users } from "lucide-react";

interface Guard {
  id: string;
  name: string;
  full_name: string | null;
  guard_code: string;
  cnic: string;
  phone: string | null;
  address: string | null;
  status: "active" | "inactive";
  branch_id: string;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  branch: { name: string } | null;
}

export default async function GuardsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, branch_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Get guards with branch info
  let query = supabase
    .from("guards")
    .select(`
      *,
      branch:branches(name, city)
    `)
    .order("created_at", { ascending: false });

  // Branch admin can only see their branch's guards
  if (profile.role === "branch_admin" && profile.branch_id) {
    query = query.eq("branch_id", profile.branch_id);
  }

  const { data: guards, error } = await query;

  if (error) {
    console.error("Error fetching guards:", error);
  }

  // Get stats
  const activeGuards = guards?.filter((g: { status: string }) => g.status === "active").length || 0;
  const inactiveGuards = guards?.filter((g: { status: string }) => g.status === "inactive").length || 0;
  const totalGuards = guards?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Guards</h1>
          <p className="text-muted-foreground">
            Manage security personnel across all locations
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/guards/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Guard
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guards</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guards?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeGuards}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Shield className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{inactiveGuards}</div>
          </CardContent>
        </Card>
      </div>

      {/* Guards Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Guards</CardTitle>
          <CardDescription>
            A list of all security personnel with their details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {guards && guards.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guard</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>CNIC</TableHead>
                  <TableHead>Phone</TableHead>
                  {profile.role === "super_admin" && <TableHead>Branch</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guards.map((guard: Guard) => (
                  <TableRow key={guard.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={guard.photo_url || undefined} alt={guard.name} />
                          <AvatarFallback>
                            {guard.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{guard.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                        {guard.guard_code}
                      </code>
                    </TableCell>
                    <TableCell>{guard.cnic}</TableCell>
                    <TableCell>{guard.phone || "—"}</TableCell>
                    {profile.role === "super_admin" && (
                      <TableCell>
                        <Badge variant="outline">
                          {(guard.branch as { name: string; code: string })?.name || "N/A"}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge
                        variant={
                          guard.status === "active"
                            ? "default"
                            : guard.status === "inactive"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {guard.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/guards/${guard.id}`}>Edit</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No guards yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first security guard.
              </p>
              <Button asChild>
                <Link href="/dashboard/guards/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Guard
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
