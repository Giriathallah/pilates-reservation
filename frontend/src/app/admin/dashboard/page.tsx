"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { format } from "date-fns";

interface AgendaItem {
    schedule_id: string;
    court_name: string;
    time: string;
    status: string;
    status_color: string;
    customer: string;
    is_available: boolean;
}

interface DashboardStats {
    revenue_today: number;
    active_sessions: number;
    pending_actions: number;
    agenda: AgendaItem[];
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showManualModal, setShowManualModal] = useState(false);

    // Manual Booking Form
    const [manualEmail, setManualEmail] = useState("");
    const [manualScheduleId, setManualScheduleId] = useState("");

    const fetchStats = async () => {
        try {
            const res = await api.get("/admin/stats");
            setStats(res.data);
        } catch (error) {
            console.error("Failed to fetch admin stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleManualBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualScheduleId || !manualEmail) return;

        try {
            await api.post("/admin/manual-booking", {
                schedule_id: manualScheduleId,
                user_email: manualEmail,
                notes: "Admin Manual Booking"
            });
            alert("Booking created!");
            setShowManualModal(false);
            setManualEmail("");
            setManualScheduleId("");
            fetchStats();
        } catch (err: any) {
            alert(err.response?.data?.error || "Failed");
        }
    };

    if (loading) return <div>Loading dashboard...</div>;
    if (!stats) return <div>Error loading data.</div>;

    // Filter available schedules for manual booking dropdown
    const availableSchedules = (stats.agenda || []).filter(i => i.is_available);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Overview</h1>

            {/* 1. Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">Revenue Today</h3>
                    <p className="text-3xl font-bold text-dark-grey">Rp {(stats.revenue_today || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">Active Sessions (Today)</h3>
                    <p className="text-3xl font-bold text-blue-600">{stats.active_sessions || 0}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-2">Pending Actions</h3>
                    <div className="flex items-center gap-2">
                        <p className="text-3xl font-bold text-orange-500">{stats.pending_actions || 0}</p>
                        {stats.pending_actions > 0 && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Needs Review</span>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 2. Today's Agenda (Span 2) */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold">Today's Agenda</h2>
                            <span className="text-sm text-gray-500">{format(new Date(), "EEEE, d MMM yyyy")}</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {(stats.agenda || []).length === 0 ? (
                                <p className="p-6 text-gray-500 text-center">No schedules for today.</p>
                            ) : (
                                (stats.agenda || []).map((item, idx) => (
                                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-24 text-sm font-bold text-gray-900">{item.time}</div>
                                            <div>
                                                <div className="font-medium text-dark-grey">{item.court_name}</div>
                                                <div className="text-sm text-gray-500">{item.customer || "Empty Slot"}</div>
                                            </div>
                                        </div>
                                        <div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                                                ${item.status_color === 'green' ? 'bg-green-100 text-green-700' :
                                                    item.status_color === 'red' ? 'bg-red-100 text-red-700' :
                                                        item.status_color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                                            item.status_color === 'blue' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-gray-100 text-gray-600'}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Quick Actions (Span 1) */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <button
                                onClick={() => setShowManualModal(true)}
                                className="w-full flex items-center justify-center gap-2 bg-dark-grey text-white py-3 rounded-lg font-bold hover:bg-black transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">add_circle</span>
                                Manual Booking
                            </button>
                            <button className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors">
                                <span className="material-symbols-outlined text-sm">block</span>
                                Block for Maintenance
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Manual Booking Modal */}
            {showManualModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Manual Booking</h3>
                        <form onSubmit={handleManualBook} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Select Schedule (Available Today)</label>
                                <select
                                    className="w-full border p-2 rounded-lg"
                                    value={manualScheduleId}
                                    onChange={e => setManualScheduleId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Start Time --</option>
                                    {availableSchedules.map(s => (
                                        <option key={s.schedule_id} value={s.schedule_id}>
                                            {s.time} - {s.court_name}
                                        </option>
                                    ))}
                                </select>
                                {availableSchedules.length === 0 && <p className="text-xs text-red-500 mt-1">No available slots today!</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">User Email</label>
                                <input
                                    type="email"
                                    className="w-full border p-2 rounded-lg"
                                    placeholder="user@example.com"
                                    value={manualEmail}
                                    onChange={e => setManualEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowManualModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >Cancel</button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                                >Book Now</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
