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
import { createInventoryItem } from "../../actions";
import { ArrowLeft } from "lucide-react";

export default async function NewInventoryItemPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Allow super_admin and branch_admin to create item types
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, branch_id")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "super_admin" && profile.role !== "branch_admin")) {
    redirect("/dashboard/inventory");
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
          <h1 className="text-3xl font-bold tracking-tight">Add Item Type</h1>
          <p className="text-muted-foreground">
            Create a new inventory item category
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
          <CardDescription>
            Define a new type of inventory item
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createInventoryItem as unknown as (formData: FormData) => void} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Security Uniform, Walkie-Talkie"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select name="category" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Safety Gear">Safety Gear</SelectItem>
                  <SelectItem value="Communication">Communication</SelectItem>
                  <SelectItem value="Weapon">Weapon</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tracking_type">Tracking Type *</Label>
              <Select name="tracking_type" defaultValue="quantity" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select tracking type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quantity">Quantity Based</SelectItem>
                  <SelectItem value="serialised">Serialised (Individual Units)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose &quot;Serialised&quot; for items that need individual tracking (weapons, radios)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_quantity">Initial Quantity</Label>
              <Input
                id="total_quantity"
                name="total_quantity"
                type="number"
                min="0"
                defaultValue="0"
                placeholder="0"
              />
            </div>

            <div className="flex gap-4">
              <SubmitButton>Create Item Type</SubmitButton>
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
