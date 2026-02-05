import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Building2, MapPin, Phone, Edit } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  created_at: string;
}

interface BranchWithCounts extends Branch {
  placeCount: number;
  guardCount: number;
}

export default async function BranchesPage() {
  const supabase = await createClient();

  // Check if user is super_admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id || "")
    .single();

  if (profile?.role !== "super_admin") {
    redirect("/dashboard");
  }

  // Fetch all branches with counts
  const { data: branches } = await supabase
    .from("branches")
    .select("*")
    .order("name");

  // Get place and guard counts for each branch
  const branchesWithCounts: BranchWithCounts[] = await Promise.all(
    (branches || []).map(async (branch) => {
      const [{ count: placeCount }, { count: guardCount }] = await Promise.all([
        supabase
          .from("places")
          .select("*", { count: "exact", head: true })
          .eq("branch_id", branch.id),
        supabase
          .from("guards")
          .select("*", { count: "exact", head: true })
          .eq("branch_id", branch.id),
      ]);
      return {
        ...branch,
        placeCount: placeCount || 0,
        guardCount: guardCount || 0,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
          <p className="text-muted-foreground">
            Manage all branch offices
          </p>
        </div>
        <Link href="/dashboard/branches/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Branch
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branchesWithCounts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Places</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {branchesWithCounts.reduce((sum, b) => sum + b.placeCount, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guards</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {branchesWithCounts.reduce((sum, b) => sum + b.guardCount, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branches Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-center">Places</TableHead>
                <TableHead className="text-center">Guards</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchesWithCounts.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">{branch.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{branch.city}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {branch.address}
                  </TableCell>
                  <TableCell>{branch.phone}</TableCell>
                  <TableCell className="text-center">{branch.placeCount}</TableCell>
                  <TableCell className="text-center">{branch.guardCount}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/branches/${branch.id}`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {branchesWithCounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">No branches found</p>
                    <Link href="/dashboard/branches/new">
                      <Button variant="link">Add your first branch</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
