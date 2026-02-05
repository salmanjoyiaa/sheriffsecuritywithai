import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit } from "lucide-react";
import { format } from "date-fns";
import { updateInvoiceStatus } from "../actions";
import { InvoiceStatusButtons } from "./invoice-status-buttons";
import { InvoiceExportButton } from "./invoice-export-button";

interface InvoicePageProps {
  params: { id: string };
}

export default async function InvoicePage({ params }: InvoicePageProps) {
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

  // Get invoice with place and line items
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(`
      *,
      place:places(id, name, address, city, contact_person, contact_phone, branch_id)
    `)
    .eq("id", params.id)
    .single();

  if (error || !invoice) {
    notFound();
  }

  // Check branch access for branch_admin
  const place = invoice.place as {
    id: string;
    name: string;
    address: string;
    city: string;
    contact_person: string | null;
    contact_phone: string | null;
    branch_id: string;
  } | null;

  if (profile.role === "branch_admin" && place?.branch_id !== profile.branch_id) {
    notFound();
  }

  // Get line items
  const { data: lineItems } = await supabase
    .from("invoice_line_items")
    .select("*")
    .eq("invoice_id", params.id)
    .order("sort_order");

  const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "outline",
    sent: "secondary",
    paid: "default",
    overdue: "destructive",
    cancelled: "destructive",
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Invoice {invoice.invoice_number}
            </h1>
            <p className="text-muted-foreground">
              Created on {format(new Date(invoice.invoice_date), "PPP")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <InvoiceExportButton
            invoice={{
              invoice_number: invoice.invoice_number,
              invoice_date: invoice.invoice_date,
              due_date: invoice.due_date || undefined,
              status: invoice.status,
              subtotal: invoice.subtotal,
              tax_amount: invoice.tax_amount,
              total: invoice.total,
              notes: invoice.notes || undefined,
              place: place ? {
                name: place.name,
                address: place.address,
                city: place.city,
                contact_person: place.contact_person || undefined,
                contact_phone: place.contact_phone || undefined,
              } : undefined,
            }}
            items={lineItems?.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              amount: item.amount,
            })) || []}
          />
          <InvoiceStatusButtons 
            invoiceId={params.id}
            status={invoice.status}
            updateStatus={updateInvoiceStatus}
          />
          <Button variant="outline" asChild>
            <Link href={`/dashboard/invoices/${params.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription>
                  {invoice.period_start && invoice.period_end ? (
                    <>Period: {format(new Date(invoice.period_start), "MMM d")} -{" "}
                    {format(new Date(invoice.period_end), "MMM d, yyyy")}</>
                  ) : (
                    <>Invoice Date: {format(new Date(invoice.invoice_date), "MMM d, yyyy")}</>
                  )}
                </CardDescription>
              </div>
              <Badge variant={statusColors[invoice.status]} className="text-sm">
                {invoice.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bill To */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                BILL TO
              </h3>
              <div>
                <p className="font-medium">{place?.name}</p>
                <p className="text-sm text-muted-foreground">{place?.address}</p>
                <p className="text-sm text-muted-foreground">{place?.city}</p>
                {place?.contact_person && (
                  <p className="text-sm mt-2">
                    Contact: {place.contact_person}
                    {place.contact_phone && ` • ${place.contact_phone}`}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Line Items */}
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unit_price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Separator />

            {/* Totals */}
            <div className="flex flex-col items-end space-y-2">
              <div className="flex justify-between w-64">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.tax_rate > 0 && (
                <div className="flex justify-between w-64">
                  <span className="text-muted-foreground">
                    Tax ({invoice.tax_rate}%)
                  </span>
                  <span>{formatCurrency(invoice.tax_amount)}</span>
                </div>
              )}
              <Separator className="w-64" />
              <div className="flex justify-between w-64 text-lg font-semibold">
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    NOTES
                  </h3>
                  <p className="text-sm">{invoice.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Invoice Number</p>
                <p className="font-medium">{invoice.invoice_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Invoice Date</p>
                <p className="font-medium">
                  {format(new Date(invoice.invoice_date), "PPP")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">
                  {invoice.due_date ? format(new Date(invoice.due_date), "PPP") : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={statusColors[invoice.status]}>
                  {invoice.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(invoice.total)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {invoice.due_date ? <>Due by {format(new Date(invoice.due_date), "PPP")}</> : "Due date not set"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
