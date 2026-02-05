"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { COMPANY_INFO, COMPANY_LOGO_BASE64 } from "@/lib/pdf-utils";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#228822",
    paddingBottom: 15,
  },
  logo: {
    width: 60,
    height: 70,
  },
  companyInfo: {
    textAlign: "right",
    flex: 1,
    marginLeft: 15,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#228822",
    marginBottom: 2,
  },
  companyTagline: {
    fontSize: 8,
    color: "#666666",
    marginBottom: 5,
  },
  companyContact: {
    fontSize: 8,
    color: "#444444",
    lineHeight: 1.3,
  },
  reportTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 5,
    textAlign: "center",
  },
  reportSubtitle: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#228822",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#228822",
    paddingBottom: 5,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },
  infoItem: {
    width: "50%",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 8,
    color: "#888888",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    color: "#333333",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statBox: {
    width: "23%",
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 4,
    textAlign: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#228822",
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 8,
    color: "#666666",
  },
  table: {
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#228822",
    padding: 8,
  },
  tableHeaderText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  tableRowAlt: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    backgroundColor: "#f9f9f9",
  },
  tableCell: {
    fontSize: 9,
    color: "#333333",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#dddddd",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: "#888888",
    marginBottom: 2,
  },
  pageNumber: {
    fontSize: 8,
    color: "#888888",
  },
  badge: {
    backgroundColor: "#228822",
    color: "#ffffff",
    padding: "2 6",
    borderRadius: 3,
    fontSize: 8,
  },
  badgeWarning: {
    backgroundColor: "#f59e0b",
  },
  badgeDanger: {
    backgroundColor: "#dc2626",
  },
});

// Guard Attendance Report PDF
interface GuardAttendanceData {
  guard: {
    id: string;
    name: string;
    guard_code: string;
  };
  place?: {
    name: string;
  };
  summary: {
    present: number;
    absent: number;
    late: number;
    half_day: number;
    leave: number;
    attendance_rate: number;
  };
  attendance: Array<{
    date: string;
    shift: string;
    status: string;
    check_in_time: string | null;
    check_out_time: string | null;
  }>;
}

interface AttendanceReportPDFProps {
  data: GuardAttendanceData[];
  period: {
    start: string;
    end: string;
  };
}

export function AttendanceReportPDF({ data, period }: AttendanceReportPDFProps) {
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src={COMPANY_LOGO_BASE64} style={styles.logo} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{COMPANY_INFO.name}</Text>
            <Text style={styles.companyTagline}>{COMPANY_INFO.tagline}</Text>
            <Text style={styles.companyContact}>
              {COMPANY_INFO.phone} | {COMPANY_INFO.email}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.reportTitle}>Guard Attendance Report</Text>
        <Text style={styles.reportSubtitle}>
          Period: {formatDate(period.start)} to {formatDate(period.end)}
        </Text>

        {/* Guards */}
        {data.map((guardData, index) => (
          <View key={index} style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>
              {guardData.guard.name} ({guardData.guard.guard_code})
              {guardData.place && ` - ${guardData.place.name}`}
            </Text>

            {/* Summary Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: "#22c55e" }]}>
                  {guardData.summary.present}
                </Text>
                <Text style={styles.statLabel}>Present</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: "#dc2626" }]}>
                  {guardData.summary.absent}
                </Text>
                <Text style={styles.statLabel}>Absent</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: "#3b82f6" }]}>
                  {guardData.summary.leave}
                </Text>
                <Text style={styles.statLabel}>Leave</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {guardData.summary.attendance_rate}%
                </Text>
                <Text style={styles.statLabel}>Attendance Rate</Text>
              </View>
            </View>

            {/* Attendance Table */}
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { width: "40%" }]}>
                  Date
                </Text>
                <Text style={[styles.tableHeaderText, { width: "30%" }]}>
                  Shift
                </Text>
                <Text style={[styles.tableHeaderText, { width: "30%" }]}>
                  Status
                </Text>
              </View>
              {guardData.attendance.slice(0, 15).map((record, idx) => (
                <View
                  key={idx}
                  style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                >
                  <Text style={[styles.tableCell, { width: "40%" }]}>
                    {formatDate(record.date)}
                  </Text>
                  <Text style={[styles.tableCell, { width: "30%" }]}>
                    {record.shift}
                  </Text>
                  <Text style={[styles.tableCell, { width: "30%" }]}>
                    {record.status}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated on {new Date().toLocaleDateString("en-PK")} |{" "}
            {COMPANY_INFO.name}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// Place Report PDF
interface PlaceReportData {
  place: {
    name: string;
    address: string | null;
    city: string | null;
    contact_person: string | null;
    contact_phone: string | null;
  };
  guards: Array<{
    id: string;
    name: string;
    guard_code: string;
    shift: string;
    start_date: string;
    end_date: string | null;
  }>;
  attendance_summary: {
    total_records: number;
    present: number;
    absent: number;
    late: number;
    attendance_rate: number;
  };
  period: {
    start: string;
    end: string;
  };
}

interface PlaceReportPDFProps {
  data: PlaceReportData;
}

export function PlaceReportPDF({ data }: PlaceReportPDFProps) {
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src={COMPANY_LOGO_BASE64} style={styles.logo} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{COMPANY_INFO.name}</Text>
            <Text style={styles.companyTagline}>{COMPANY_INFO.tagline}</Text>
            <Text style={styles.companyContact}>
              {COMPANY_INFO.phone} | {COMPANY_INFO.email}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.reportTitle}>Place Report</Text>
        <Text style={styles.reportSubtitle}>
          Period: {formatDate(data.period.start)} to {formatDate(data.period.end)}
        </Text>

        {/* Place Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Details</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Place Name</Text>
              <Text style={styles.infoValue}>{data.place.name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>City</Text>
              <Text style={styles.infoValue}>{data.place.city || "-"}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{data.place.address || "-"}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Contact Person</Text>
              <Text style={styles.infoValue}>
                {data.place.contact_person || "-"}
              </Text>
            </View>
          </View>
        </View>

        {/* Attendance Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance Summary</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {data.attendance_summary.total_records}
              </Text>
              <Text style={styles.statLabel}>Total Records</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: "#22c55e" }]}>
                {data.attendance_summary.present}
              </Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: "#dc2626" }]}>
                {data.attendance_summary.absent}
              </Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {data.attendance_summary.attendance_rate}%
              </Text>
              <Text style={styles.statLabel}>Attendance Rate</Text>
            </View>
          </View>
        </View>

        {/* Assigned Guards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Assigned Guards ({data.guards.length})
          </Text>
          {data.guards.length > 0 ? (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { width: "20%" }]}>
                  Code
                </Text>
                <Text style={[styles.tableHeaderText, { width: "30%" }]}>
                  Name
                </Text>
                <Text style={[styles.tableHeaderText, { width: "15%" }]}>
                  Shift
                </Text>
                <Text style={[styles.tableHeaderText, { width: "17%" }]}>
                  Start Date
                </Text>
                <Text style={[styles.tableHeaderText, { width: "18%" }]}>
                  End Date
                </Text>
              </View>
              {data.guards.map((guard, idx) => (
                <View
                  key={idx}
                  style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                >
                  <Text style={[styles.tableCell, { width: "20%" }]}>
                    {guard.guard_code}
                  </Text>
                  <Text style={[styles.tableCell, { width: "30%" }]}>
                    {guard.name}
                  </Text>
                  <Text style={[styles.tableCell, { width: "15%" }]}>
                    {guard.shift}
                  </Text>
                  <Text style={[styles.tableCell, { width: "17%" }]}>
                    {guard.start_date ? formatDate(guard.start_date) : "-"}
                  </Text>
                  <Text style={[styles.tableCell, { width: "18%" }]}>
                    {guard.end_date ? formatDate(guard.end_date) : "Ongoing"}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: "#666666", textAlign: "center", padding: 20 }}>
              No guards currently assigned to this place
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated on {new Date().toLocaleDateString("en-PK")} |{" "}
            {COMPANY_INFO.name}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// Monthly Summary Report PDF
interface MonthlySummaryData {
  month: string;
  year: number;
  stats: {
    totalGuards: number;
    activeAssignments: number;
    totalAttendance: number;
    presentDays: number;
    absentDays: number;
    attendanceRate: number;
    totalRevenue: number;
    pendingInvoices: number;
  };
}

interface MonthlySummaryPDFProps {
  data: MonthlySummaryData;
  branchName?: string;
}

export function MonthlySummaryPDF({ data, branchName }: MonthlySummaryPDFProps) {
  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src={COMPANY_LOGO_BASE64} style={styles.logo} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{COMPANY_INFO.name}</Text>
            <Text style={styles.companyTagline}>{COMPANY_INFO.tagline}</Text>
            <Text style={styles.companyContact}>
              {COMPANY_INFO.phone} | {COMPANY_INFO.email}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.reportTitle}>Monthly Summary Report</Text>
        <Text style={styles.reportSubtitle}>
          {data.month} {data.year}
          {branchName && ` | ${branchName}`}
        </Text>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guard Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{data.stats.totalGuards}</Text>
              <Text style={styles.statLabel}>Total Guards</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {data.stats.activeAssignments}
              </Text>
              <Text style={styles.statLabel}>Active Assignments</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: "#22c55e" }]}>
                {data.stats.presentDays}
              </Text>
              <Text style={styles.statLabel}>Present Days</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {data.stats.attendanceRate}%
              </Text>
              <Text style={styles.statLabel}>Attendance Rate</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Summary</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { width: "48%" }]}>
              <Text style={[styles.statValue, { color: "#228822" }]}>
                {formatCurrency(data.stats.totalRevenue)}
              </Text>
              <Text style={styles.statLabel}>Total Revenue</Text>
            </View>
            <View style={[styles.statBox, { width: "48%" }]}>
              <Text style={[styles.statValue, { color: "#dc2626" }]}>
                {data.stats.pendingInvoices}
              </Text>
              <Text style={styles.statLabel}>Pending Invoices</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated on {new Date().toLocaleDateString("en-PK")} |{" "}
            {COMPANY_INFO.name}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
