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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { createInventoryUnit } from "../../actions";
import { ArrowLeft } from "lucide-react";

export default async function NewInventoryUnitPage() {
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

  // Get inventory items
  const { data: items } = await supabase
    .from("inventory_items")
    .select("id, name, category")
    .order("category")
    .order("name");

  // Get branches for super_admin
  let branches: { id: string; name: string; city: string }[] = [];
  if (profile.role === "super_admin") {
    const { data } = await supabase
      .from("branches")
      .select("id, name, city")
      .eq("status", "active")
      .order("name");
    branches = data || [];
  }

  async function handleSubmit(formData: FormData) {
    "use server";
    const result = await createInventoryUnit(formData);
    if (result.success) {
      redirect("/dashboard/inventory");
    }
    return result;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Inventory Unit</h1>
          <p className="text-muted-foreground">
            Add a new inventory unit with serial number
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Unit Details</CardTitle>
          <CardDescription>
            Enter the details for the new inventory unit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit as unknown as (formData: FormData) => void} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="item_id">Item Type *</Label>
              <Select name="item_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select item type" />
                </SelectTrigger>
                <SelectContent>
                  {items?.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serial_number">Serial Number *</Label>
              <Input
                id="serial_number"
                name="serial_number"
                placeholder="e.g., UNI-001, WT-2024-001"
                required
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier for this specific unit
              </p>
            </div>

            {profile.role === "super_admin" ? (
              <div className="space-y-2">
                <Label htmlFor="branch_id">Branch *</Label>
                <Select name="branch_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} ({branch.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <input type="hidden" name="branch_id" value={profile.branch_id || ""} />
            )}

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue="available">
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Additional notes about this unit"
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <SubmitButton>Add Unit</SubmitButton>
              <Button variant="outline" asChild>
                <Link href="/dashboard/inventory">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
