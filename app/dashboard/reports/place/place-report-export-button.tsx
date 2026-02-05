"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { PlaceReportPDF } from "@/components/pdf/report-pdf";
import { PlaceReportData } from "../actions";

interface PlaceReportExportButtonProps {
  reportData: PlaceReportData;
  startDate: string;
  endDate: string;
}

export function PlaceReportExportButton({
  reportData,
  startDate,
  endDate,
}: PlaceReportExportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleExport() {
    setIsGenerating(true);

    try {
      // Prepare data for PDF
      const pdfData = {
        place: {
          name: reportData.place.name,
          address: reportData.place.address,
          city: reportData.place.city,
          contact_person: reportData.place.contact_person,
          contact_phone: reportData.place.contact_phone,
        },
        guards: reportData.guards.map((g) => ({
          id: g.id,
          name: g.name,
          guard_code: g.guard_code,
          shift: g.shift,
          start_date: g.start_date,
          end_date: g.end_date,
        })),
        attendance_summary: {
          total_records: reportData.attendance_summary.total_records,
          present: reportData.attendance_summary.present,
          absent: reportData.attendance_summary.absent,
          late: reportData.attendance_summary.late,
          attendance_rate: reportData.attendance_summary.attendance_rate,
        },
        period: {
          start: startDate,
          end: endDate,
        },
        inventory: reportData.inventory.map((item) => ({
          id: item.id,
          item_name: item.item_name,
          serial_number: item.serial_number,
          quantity: item.quantity,
          assigned_at: item.assigned_at,
          assigned_to_guard: item.assigned_to_guard,
        })),
      };

      // Generate PDF blob
      const blob = await pdf(<PlaceReportPDF data={pdfData} />).toBlob();

      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `place-report-${reportData.place.name.replace(/\s+/g, "-").toLowerCase()}-${startDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleExport} disabled={isGenerating}>
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </>
      )}
    </Button>
  );
}
