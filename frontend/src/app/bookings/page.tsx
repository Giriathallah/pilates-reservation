"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { format } from "date-fns";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

interface Reservation {
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

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <main className="min-h-screen bg-soft-white flex flex-col">
            <Navbar />

            <div className="grow pt-32 pb-20 px-6 md:px-20">
                <div className="container-width">
                    <div className="mb-8 flex items-end justify-between">
                        <div>
                            <h4 className="text-sm font-bold uppercase tracking-widest text-primary/70 mb-2">
                                History
                            </h4>
                            <h1 className="font-serif text-4xl text-dark-grey md:text-5xl">
                                My Bookings
                            </h1>
                        </div>
                        <Link
                            href="/reserve"
                            className="hidden md:block rounded-full bg-primary px-8 py-3 text-sm font-bold text-white transition-all hover:shadow-lg hover:scale-105"
                        >
                            Book New Session
                        </Link>
                    </div>

                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-gray-200"></div>)}
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-20 text-center shadow-sm">
                            <span className="material-symbols-outlined mb-4 text-4xl text-gray-300">event_busy</span>
                            <h3 className="text-xl font-bold text-dark-grey mb-2">No bookings found</h3>
                            <p className="text-gray-500 mb-6">You haven't made any reservations yet.</p>
                            <Link
                                href="/reserve"
                                className="rounded-full bg-primary px-8 py-3 text-sm font-bold text-white transition-all hover:shadow-lg hover:scale-105"
                            >
                                Book Your First Session
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {bookings.map((booking) => (
                                <div key={booking.id} className="relative flex flex-col md:flex-row md:items-center justify-between rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                                    <div className="mb-4 md:mb-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide 
                                        ${booking.status === 'paid' || booking.status === 'success' ? 'bg-green-100 text-green-700' :
                                                    booking.status === 'cancelled' || booking.status === 'expire' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {booking.status}
                                            </span>
                                            <span className="text-xs text-dark-grey/40">
                                                Booked on {format(new Date(booking.created_at), "MMM d, yyyy")}
                                            </span>
                                        </div>
                                        <h4 className="font-serif text-xl font-bold text-dark-grey">
                                            {booking.court?.name || "Pilates Session"}
                                        </h4>
                                        <p className="text-dark-grey/70 mt-1">
                                            <span className="material-symbols-outlined text-sm align-middle mr-1">calendar_today</span>
                                            {format(new Date(booking.schedule.date), "EEEE, MMMM d, yyyy")}
                                            <span className="mx-2">•</span>
                                            <span className="material-symbols-outlined text-sm align-middle mr-1">schedule</span>
                                            {booking.schedule.start_time.substring(0, 5)} - {booking.schedule.end_time.substring(0, 5)}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-start md:items-end gap-2">
                                        <p className="font-serif text-xl font-bold text-primary">Rp {booking.total_amount.toLocaleString()}</p>

                                        {(booking.status === 'pending') && (
                                            <button
                                                className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90"
                                                onClick={() => {/* Trigger snap again? Maybe too complex for now, just show status */ }}
                                            >
                                                Pay Now
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </main>
    );
}
