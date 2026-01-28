"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";

export default function SuccessPage() {
    const searchParams = useSearchParams();
    const reservationId = searchParams.get("id");
    const [status, setStatus] = useState<"loading" | "success" | "pending" | "failed">("loading");
    const [message, setMessage] = useState("Verifying payment status...");

    useEffect(() => {
        const checkStatus = async () => {
            if (!reservationId) {
                setStatus("success"); // Fallback if no ID provided (legacy behavior)
                return;
            }

            try {
                // Determine implicit status from URL if provided (legacy handling), but verify with backend
                // The Proactive Check is triggered by calling GetMyReservations
                // We'll call it, then find our specific reservation to see its status
                setMessage("Syncing with bank...");
                const res = await api.get("/reservations/my");
                const bookings = res.data.data;
                const currentBooking = bookings.find((b: any) => b.id === reservationId);

                if (currentBooking) {
                    if (currentBooking.status === "paid" || currentBooking.status === "confirmed") {
                        setStatus("success");
                    } else if (currentBooking.status === "pending") {
                        setStatus("pending");
                    } else if (currentBooking.status === "cancelled" || currentBooking.status === "failed") {
                        setStatus("failed");
                    } else {
                        setStatus("success"); // Default safe
                    }
                } else {
                    // Not found? Maybe wrong user or delay
                    setStatus("pending");
                }

            } catch (error) {
                console.error("Verification failed", error);
                setStatus("pending"); // Assume pending on error
                setMessage("Could not verify status automatically. Please check dashboard.");
            }
        };

        // Delay slightly to ensure backend Proactive Check has time to run if it was a race
        const timer = setTimeout(() => {
            checkStatus();
        }, 1500);

        return () => clearTimeout(timer);
    }, [reservationId]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-soft-white px-6 text-center">
            {status === "loading" && (
                <>
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-500 animate-pulse">
                        <span className="material-symbols-outlined text-4xl">sync</span>
                    </div>
                    <h1 className="mb-4 font-serif text-3xl text-dark-grey">Processing...</h1>
                    <p className="mb-8 max-w-md text-dark-grey/60">
                        {message}
                    </p>
                </>
            )}

            {status === "success" && (
                <>
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <span className="material-symbols-outlined text-4xl">check_circle</span>
                    </div>

                    <h1 className="mb-4 font-serif text-4xl text-dark-grey">Booking Confirmed!</h1>
                    <p className="mb-8 max-w-md text-dark-grey/60">
                        Your spot has been reserved successfully. Get ready to move!
                    </p>

                    <div className="flex flex-col gap-4 sm:flex-row">
                        <Link
                            href="/"
                            className="rounded-full bg-primary px-8 py-3 text-sm font-bold text-white transition-all hover:shadow-lg hover:scale-105"
                        >
                            Go to Dashboard
                        </Link>
                        <Link
                            href="/reserve"
                            className="rounded-full border border-dark-grey/20 px-8 py-3 text-sm font-bold text-dark-grey transition-all hover:bg-white"
                        >
                            Book Another
                        </Link>
                    </div>
                </>
            )}

            {status === "pending" && (
                <>
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                        <span className="material-symbols-outlined text-4xl">hourglass_empty</span>
                    </div>

                    <h1 className="mb-4 font-serif text-4xl text-dark-grey">Payment Pending</h1>
                    <p className="mb-8 max-w-md text-dark-grey/60">
                        We haven't received confirmation yet. It might take a few moments. Please check your dashboard.
                    </p>

                    <div className="flex flex-col gap-4 sm:flex-row">
                        <Link
                            href="/"
                            className="rounded-full bg-primary px-8 py-3 text-sm font-bold text-white transition-all hover:shadow-lg hover:scale-105"
                        >
                            Check Dashboard
                        </Link>
                    </div>
                </>
            )}

            {status === "failed" && (
                <>
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600">
                        <span className="material-symbols-outlined text-4xl">error</span>
                    </div>

                    <h1 className="mb-4 font-serif text-4xl text-dark-grey">Booking Failed</h1>
                    <p className="mb-8 max-w-md text-dark-grey/60">
                        The payment was cancelled or failed. Please try booking again.
                    </p>

                    <div className="flex flex-col gap-4 sm:flex-row">
                        <Link
                            href="/reserve"
                            className="rounded-full bg-primary px-8 py-3 text-sm font-bold text-white transition-all hover:shadow-lg hover:scale-105"
                        >
                            Try Again
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}
