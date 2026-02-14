"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Activity,
    Mail,
    MailCheck,
    MailX,
    Clock,
    Phone,
    MapPin,
    Shield,
    TrendingUp,
    Users,
    Eye,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    XCircle,
    CheckCircle2,
    AlertCircle,
    Loader2,
    MessageSquare,
} from "lucide-react";

interface ServiceRequest {
    id: string;
    request_number: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    company_name: string | null;
    service_type: string;
    location_address: string;
    location_city: string | null;
    num_guards: number;
    duration_hours: number | null;
    hourly_rate: number | null;
    estimated_total: number | null;
    status: string;
    priority: string;
    source: string;
    email_status: string | null;
    ai_transcript: string | null;
    created_at: string;
}

interface Stats {
    total: number;
    today: number;
    emailsSent: number;
    emailsFailed: number;
    totalRevenue: number;
}

export default function AIMonitorPage() {
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, today: 0, emailsSent: 0, emailsFailed: 0, totalRevenue: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const fetchData = useCallback(async () => {
        const supabase = createClient();

        const { data, error } = await supabase
            .from("service_requests")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            console.error("Error fetching requests:", error);
            return;
        }

        const reqs = (data || []) as unknown as ServiceRequest[];
        setRequests(reqs);

        // Calculate stats
        const today = new Date().toISOString().split("T")[0];
        const todayRequests = reqs.filter(r => r.created_at.startsWith(today));
        const emailsSent = reqs.filter(r => r.email_status === "sent").length;
        const emailsFailed = reqs.filter(r => r.email_status === "failed").length;
        const totalRevenue = reqs.reduce((sum, r) => sum + (r.estimated_total || 0), 0);

        setStats({
            total: reqs.length,
            today: todayRequests.length,
            emailsSent,
            emailsFailed,
            totalRevenue,
        });

        setLastRefresh(new Date());
        setLoading(false);
    }, []);

    // Initial load and auto-refresh
    useEffect(() => {
        fetchData();

        let interval: NodeJS.Timeout | null = null;
        if (autoRefresh) {
            interval = setInterval(fetchData, 10000); // Every 10 seconds
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [fetchData, autoRefresh]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "new": return "bg-blue-100 text-blue-700";
            case "contacted": return "bg-amber-100 text-amber-700";
            case "in_progress": return "bg-indigo-100 text-indigo-700";
            case "completed": return "bg-emerald-100 text-emerald-700";
            case "cancelled": return "bg-red-100 text-red-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getEmailIcon = (status: string | null) => {
        switch (status) {
            case "sent": return <MailCheck className="h-4 w-4 text-emerald-500" />;
            case "failed": return <MailX className="h-4 w-4 text-red-500" />;
            case "sending": return <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />;
            default: return <Mail className="h-4 w-4 text-gray-400" />;
        }
    };

    const timeSince = (dateStr: string) => {
        const now = new Date();
        const date = new Date(dateStr);
        const secs = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (secs < 60) return `${secs}s ago`;
        if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
        if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
        return `${Math.floor(secs / 86400)}d ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="h-6 w-6 text-primary" />
                        AI Voice Agent Monitor
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Real-time tracking of voice agent conversations and service requests
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${autoRefresh
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-gray-50 text-gray-600 border border-gray-200"
                            }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
                        {autoRefresh ? "Live" : "Paused"}
                    </button>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </button>
                    <span className="text-xs text-gray-400">
                        Updated {lastRefresh.toLocaleTimeString()}
                    </span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Total Requests</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                        </div>
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <MessageSquare className="h-5 w-5 text-indigo-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Today</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.today}</p>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Emails Sent</p>
                            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.emailsSent}</p>
                        </div>
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <MailCheck className="h-5 w-5 text-emerald-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Emails Failed</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">{stats.emailsFailed}</p>
                        </div>
                        <div className="p-2 bg-red-50 rounded-lg">
                            <MailX className="h-5 w-5 text-red-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Est. Revenue</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                PKR {stats.totalRevenue.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-2 bg-amber-50 rounded-lg">
                            <Shield className="h-5 w-5 text-amber-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Request Feed + Detail Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Live Feed */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />
                            Live Request Feed
                        </h2>
                        <span className="text-xs text-gray-400">{requests.length} requests</span>
                    </div>

                    <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                        {requests.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                                <p className="font-medium">No requests yet</p>
                                <p className="text-sm mt-1">Voice agent requests will appear here in real-time</p>
                            </div>
                        ) : (
                            requests.map((req) => (
                                <button
                                    key={req.id}
                                    onClick={() => setSelectedRequest(selectedRequest?.id === req.id ? null : req)}
                                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selectedRequest?.id === req.id ? "bg-primary/5 border-l-2 border-primary" : ""
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="shrink-0">
                                                {getEmailIcon(req.email_status)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-mono text-sm font-medium text-gray-900">
                                                        {req.request_number}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                                                        {req.status.replace("_", " ")}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 truncate">
                                                    {req.customer_name} — {req.service_type}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                            <span className="text-xs text-gray-400">
                                                {timeSince(req.created_at)}
                                            </span>
                                            {selectedRequest?.id === req.id ? (
                                                <ChevronUp className="h-4 w-4 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4 text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Detail Panel */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Eye className="h-4 w-4 text-primary" />
                            Request Details
                        </h2>
                    </div>

                    {selectedRequest ? (
                        <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                            {/* Request Info */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-mono font-bold text-lg text-gray-900">
                                        {selectedRequest.request_number}
                                    </h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                                        {selectedRequest.status.replace("_", " ")}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400">
                                    {new Date(selectedRequest.created_at).toLocaleString()}
                                </p>
                            </div>

                            {/* Customer */}
                            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                    <Users className="h-3 w-3" /> Customer
                                </h4>
                                <p className="text-sm font-medium text-gray-900">{selectedRequest.customer_name}</p>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <Mail className="h-3 w-3" /> {selectedRequest.customer_email}
                                </p>
                                {selectedRequest.customer_phone && (
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                        <Phone className="h-3 w-3" /> {selectedRequest.customer_phone}
                                    </p>
                                )}
                                {selectedRequest.company_name && (
                                    <p className="text-sm text-gray-600">{selectedRequest.company_name}</p>
                                )}
                            </div>

                            {/* Service Details */}
                            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                    <Shield className="h-3 w-3" /> Service
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <p className="text-gray-400 text-xs">Type</p>
                                        <p className="font-medium text-gray-900 capitalize">{selectedRequest.service_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs">Guards</p>
                                        <p className="font-medium text-gray-900">{selectedRequest.num_guards}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs">Duration</p>
                                        <p className="font-medium text-gray-900">{selectedRequest.duration_hours || "—"} hrs</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-xs">Rate</p>
                                        <p className="font-medium text-gray-900">PKR {selectedRequest.hourly_rate || "—"}/hr</p>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-gray-200">
                                    <p className="text-gray-400 text-xs">Location</p>
                                    <p className="text-sm text-gray-900 flex items-center gap-1">
                                        <MapPin className="h-3 w-3 shrink-0" />
                                        {selectedRequest.location_address}
                                        {selectedRequest.location_city && `, ${selectedRequest.location_city}`}
                                    </p>
                                </div>
                                {selectedRequest.estimated_total && (
                                    <div className="pt-2 border-t border-gray-200">
                                        <p className="text-gray-400 text-xs">Estimated Total</p>
                                        <p className="text-lg font-bold text-primary">
                                            PKR {selectedRequest.estimated_total.toLocaleString()}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Email Delivery Status */}
                            <div className="bg-gray-50 rounded-lg p-3">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-2">
                                    <Mail className="h-3 w-3" /> Email Status
                                </h4>
                                <div className="flex items-center gap-2">
                                    {selectedRequest.email_status === "sent" ? (
                                        <>
                                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                            <div>
                                                <p className="text-sm font-medium text-emerald-700">Delivered</p>
                                                <p className="text-xs text-gray-400">Confirmation sent to customer &amp; owner</p>
                                            </div>
                                        </>
                                    ) : selectedRequest.email_status === "failed" ? (
                                        <>
                                            <XCircle className="h-5 w-5 text-red-500" />
                                            <div>
                                                <p className="text-sm font-medium text-red-700">Failed</p>
                                                <p className="text-xs text-gray-400">Email delivery failed</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="h-5 w-5 text-gray-400" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">Pending</p>
                                                <p className="text-xs text-gray-400">Email not yet sent</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* AI Transcript */}
                            {selectedRequest.ai_transcript && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-2">
                                        <MessageSquare className="h-3 w-3" /> AI Conversation
                                    </h4>
                                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                                        {selectedRequest.ai_transcript.split("\n").map((line, i) => {
                                            const isUser = line.startsWith("user:");
                                            const isAssistant = line.startsWith("assistant:");
                                            const content = line.replace(/^(user|assistant):\s*/, "");
                                            if (!content.trim()) return null;
                                            return (
                                                <div
                                                    key={i}
                                                    className={`text-xs px-2.5 py-1.5 rounded-lg ${isUser
                                                            ? "bg-indigo-50 text-indigo-800 ml-4"
                                                            : isAssistant
                                                                ? "bg-white text-gray-700 mr-4 border border-gray-200"
                                                                : "bg-white text-gray-500"
                                                        }`}
                                                >
                                                    <span className="font-medium text-gray-400 block text-[10px] mb-0.5">
                                                        {isUser ? "Customer" : isAssistant ? "Aisha" : ""}
                                                    </span>
                                                    {content}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-400">
                            <Eye className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                            <p className="text-sm">Select a request to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
