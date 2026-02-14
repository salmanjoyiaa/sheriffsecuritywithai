"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { branchSchema, type BranchFormData } from "@/lib/validations";
import { createBranch } from "../actions";

export default function NewBranchPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
  });

  const onSubmit = async (data: BranchFormData) => {
    setIsSubmitting(true);
    try {
      const result = await createBranch(data);
      if (result.success) {
        toast({
          title: "Branch Created",
          description: (result as { warning?: string }).warning
            ? (result as { warning?: string }).warning
            : "The branch has been created successfully.",
          variant: (result as { warning?: string }).warning ? "destructive" : "default",
        });
        router.push("/dashboard/branches");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to create branch",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/branches">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Branch</h1>
          <p className="text-muted-foreground">Create a new branch office</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Branch Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Branch Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Lahore Branch"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="e.g., Lahore"
                  {...register("city")}
                />
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                placeholder="Full address"
                {...register("address")}
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                placeholder="03001234567"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            {/* Branch Admin Account */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Branch Admin Account</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Create login credentials so the branch manager can access their dashboard.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin_email">Admin Email</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    placeholder="branch@sheriffsecurity.com"
                    {...register("admin_email")}
                  />
                  {errors.admin_email && (
                    <p className="text-sm text-destructive">{errors.admin_email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin_password">Admin Password</Label>
                  <Input
                    id="admin_password"
                    type="password"
                    placeholder="Min 6 characters"
                    {...register("admin_password")}
                  />
                  {errors.admin_password && (
                    <p className="text-sm text-destructive">{errors.admin_password.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Branch"
                )}
              </Button>
              <Link href="/dashboard/branches">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
