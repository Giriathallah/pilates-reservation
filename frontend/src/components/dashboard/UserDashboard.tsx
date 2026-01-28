
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { format, isFuture, isPast, isSameMonth, parseISO } from "date-fns";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface Booking {
    id: string;
    created_at: string;
    status: string;
    court: {
        name: string;
    };
    schedule: {
        date: string;
        start_time: string;
        end_time: string;
    };
    total_amount: number;
}

export default function UserDashboard({ user }: { user: User }) {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"pending" | "upcoming" | "history">("pending");

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await api.get("/reservations/my");
                if (res.data.data) {
                    setBookings(res.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch bookings", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    // Helper to parse schedule date/time safely
    const getScheduleDate = (dateStr: string, timeStr: string) => {
        // dateStr is like "2026-01-31T00:00:00Z"
        // timeStr is like "09:00" or "09:00:00"
        const yyyymmdd = dateStr.split("T")[0];
        return parseISO(`${yyyymmdd}T${timeStr}`);
    };

    // Derived Stats
    const stats = useMemo(() => {
        const now = new Date();
        const paidBookings = bookings.filter(b => b.status === "paid" || b.status === "confirmed");

        const totalSessions = paidBookings.length;
        const thisMonthSessions = paidBookings.filter(b =>
            isSameMonth(parseISO(b.schedule.date), now)
        ).length;

        // Next Session: Earliest future paid booking
        const upcoming = paidBookings
            .filter(b => isFuture(getScheduleDate(b.schedule.date, b.schedule.start_time)))
            .sort((a, b) => getScheduleDate(a.schedule.date, a.schedule.start_time).getTime() - getScheduleDate(b.schedule.date, b.schedule.start_time).getTime());

        const nextSession = upcoming.length > 0 ? upcoming[0] : null;

        // Calendar Dates (for dots)
        const workoutDates = paidBookings.map(b => b.schedule.date);

        return { totalSessions, thisMonthSessions, nextSession, workoutDates };
    }, [bookings]);

    // Filtered Lists
    const filteredBookings = useMemo(() => {
        const now = new Date();
        if (activeTab === "pending") {
            return bookings.filter(b => b.status === "pending");
        } else if (activeTab === "upcoming") {
            return bookings
                .filter(b => (b.status === "paid" || b.status === "confirmed") && isFuture(getScheduleDate(b.schedule.date, b.schedule.start_time)))
                .sort((a, b) => getScheduleDate(a.schedule.date, a.schedule.start_time).getTime() - getScheduleDate(b.schedule.date, b.schedule.start_time).getTime());
        } else {
            // History
            return bookings
                .filter(b => isPast(getScheduleDate(b.schedule.date, b.schedule.start_time)) || b.status === "cancelled" || b.status === "failed")
                .sort((a, b) => getScheduleDate(b.schedule.date, b.schedule.start_time).getTime() - getScheduleDate(a.schedule.date, a.schedule.start_time).getTime());
        }
    }, [bookings, activeTab]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading your studio...</div>;

    return (
        <section className="min-h-screen px-6 pt-24 pb-20 md:px-20 bg-soft-white">
            <div className="container-width">

                {/* Header Welcome */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-1">My Studio</h4>
                        <h1 className="font-serif text-3xl md:text-4xl text-dark-grey">
                            Ready to move, {user.name.split(" ")[0]}?
                        </h1>
                    </div>
                    {user.role === 'admin' && (
                        <Link href="/admin/dashboard" className="px-4 py-2 bg-dark-grey text-white text-xs font-bold uppercase rounded-lg hover:bg-black">
                            Admin Dashboard
                        </Link>
                    )}
                </div>

                {/* Top Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                            <span className="material-symbols-outlined">local_fire_department</span>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Workouts</p>
                            <p className="text-2xl font-bold text-dark-grey">{stats.totalSessions} Sessions</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <span className="material-symbols-outlined">calendar_month</span>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">This Month</p>
                            <p className="text-2xl font-bold text-dark-grey">{stats.thisMonthSessions} Sessions</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                            <span className="material-symbols-outlined">confirmation_number</span>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Credits</p>
                            <p className="text-2xl font-bold text-dark-grey">Rp 0</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content (Left) */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Hero Card: Next Session */}
                        {stats.nextSession ? (
                            <div className="relative overflow-hidden rounded-3xl bg-dark-grey text-white p-8 shadow-lg">
                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div>
                                        <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase mb-4 backdrop-blur-sm">
                                            Your Next Class
                                        </div>
                                        <h2 className="font-serif text-3xl mb-2">{stats.nextSession.court.name}</h2>
                                        <p className="text-white/80 flex items-center gap-2 text-lg">
                                            <span className="material-symbols-outlined">schedule</span>
                                            {format(new Date(stats.nextSession.schedule.date), "EEEE, d MMM")} • {stats.nextSession.schedule.start_time.substring(0, 5)}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2 w-full md:w-auto">
                                        {/* <button className="bg-white text-dark-grey px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors w-full text-center">
                                            View Ticket
                                        </button> */}
                                    </div>
                                </div>
                                {/* Decorative Circles */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"></div>
                            </div>
                        ) : (
                            <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10 text-center">
                                <h3 className="font-serif text-2xl text-dark-grey mb-2">No upcoming classes</h3>
                                <p className="text-dark-grey/60 mb-6">You have no scheduled workouts. Let's get moving!</p>
                                <Link href="/reserve" className="inline-block bg-primary text-white px-8 py-3 rounded-full font-bold hover:shadow-lg transition-all">
                                    Book a Session
                                </Link>
                            </div>
                        )}

                        {/* Tabs & List */}
                        <div>
                            <div className="flex items-center gap-6 border-b border-gray-200 mb-6">
                                <button
                                    onClick={() => setActiveTab("pending")}
                                    className={`pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors
                                    ${activeTab === "pending" ? "border-primary text-primary" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                                >
                                    Awaiting Payment ({bookings.filter(b => b.status === "pending").length})
                                </button>
                                <button
                                    onClick={() => setActiveTab("upcoming")}
                                    className={`pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors
                                    ${activeTab === "upcoming" ? "border-primary text-primary" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                                >
                                    Upcoming
                                </button>
                                <button
                                    onClick={() => setActiveTab("history")}
                                    className={`pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors
                                    ${activeTab === "history" ? "border-primary text-primary" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                                >
                                    History
                                </button>
                            </div>

                            <div className="space-y-4">
                                {filteredBookings.length === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-xl border border-gray-100 border-dashed">
                                        <p className="text-gray-400">No bookings in this tab.</p>
                                    </div>
                                ) : (
                                    filteredBookings.map(booking => (
                                        <div key={booking.id} className="group bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                {/* Date Thumbnail */}
                                                <div className="flex-shrink-0 w-16 h-16 bg-gray-50 rounded-lg flex flex-col items-center justify-center border border-gray-100">
                                                    <span className="text-xs font-bold text-gray-400 uppercase">{format(new Date(booking.schedule.date), "MMM")}</span>
                                                    <span className="text-xl font-bold text-dark-grey">{format(new Date(booking.schedule.date), "d")}</span>
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-lg text-dark-grey">{booking.court.name}</h4>
                                                        {booking.status === 'pending' && (
                                                            <span className="text-[10px] font-bold uppercase bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse">Unpaid</span>
                                                        )}
                                                        {(booking.status === 'paid' || booking.status === 'confirmed') && (
                                                            <span className="text-[10px] font-bold uppercase bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Paid</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 mb-1">
                                                        {format(new Date(booking.schedule.date), "EEEE")} • {booking.schedule.start_time.substring(0, 5)} - {booking.schedule.end_time.substring(0, 5)}
                                                    </p>
                                                    <p className="text-xs font-bold text-primary">Rp {booking.total_amount.toLocaleString()}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 w-full md:w-auto">
                                                {booking.status === 'pending' ? (
                                                    <Link href={`/reservations/success?id=${booking.id}`} className="flex-1 md:flex-none text-center bg-primary text-white px-6 py-2 rounded-full text-sm font-bold hover:shadow-lg transition-all">
                                                        Pay Now
                                                    </Link>
                                                ) : activeTab === 'history' ? (
                                                    <Link href="/reserve" className="flex-1 md:flex-none text-center border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-50">
                                                        Book Again
                                                    </Link>
                                                ) : (
                                                    <button className="flex-1 md:flex-none px-4 py-2 text-sm font-bold text-gray-500 hover:text-dark-grey cursor-default">
                                                        Confirmed
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar (Right) */}
                    <div className="space-y-8">
                        {/* Mini Calendar Widget */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-dark-grey mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined">calendar_today</span>
                                Consistency
                            </h3>
                            {/* Simple Grid Mockup for Calendar */}
                            <div className="grid grid-cols-7 gap-2 text-center text-xs mb-2">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="text-gray-400 font-bold">{d}</div>)}
                            </div>
                            <div className="grid grid-cols-7 gap-2">
                                {Array.from({ length: 30 }).map((_, i) => {
                                    // Mock logic to highlight some days based on workoutDates
                                    // In real app, map actual days of month
                                    const isWorkout = (i % 5 === 0);
                                    return (
                                        <div key={i} className={`aspect-square flex items-center justify-center rounded-full text-xs
                                            ${isWorkout ? 'bg-primary/10 text-primary font-bold' : 'text-gray-400'}`}>
                                            {i + 1}
                                        </div>
                                    )
                                })}
                            </div>
                            <p className="text-xs text-center text-gray-400 mt-4">Keep your streak alive!</p>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-dark-grey text-white p-6 rounded-2xl shadow-lg">
                            <h3 className="font-bold mb-4">Quick Actions</h3>
                            <ul className="space-y-3">
                                <li>
                                    <Link href="/reserve" className="flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                                            <span className="material-symbols-outlined text-sm">add</span>
                                        </div>
                                        <span className="font-bold text-sm">Book a Class</span>
                                    </Link>
                                </li>
                                <li>
                                    <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-left">
                                        <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-sm">person</span>
                                        </div>
                                        <span className="font-bold text-sm">Edit Profile</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
