"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import DateStep from "@/components/wizard/DateStep";
import TimeStep from "@/components/wizard/TimeStep";
import CourtStep from "@/components/wizard/CourtStep";
import SummaryStep from "@/components/wizard/SummaryStep";

// Types
interface Court {
    court_id: string; // From API response
    schedule_id: string;
    court_name: string;
    price: number;
    capacity: number;
}

export default function ReservationPage() {
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    // State
    const [step, setStep] = useState(1);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);

    // Payment State
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Navigation Logic
    const nextStep = () => setStep((prev) => prev + 1);
    const prevStep = () => setStep((prev) => prev - 1);

    // Booking Logic
    const handleBook = async () => {
        if (!isAuthenticated) {
            router.push("/sign-in");
            return;
        }

        if (!selectedCourt || !selectedDate || !selectedTime) return;

        setProcessing(true);
        setError(null);

        try {
            // A. Create Reservation ke Backend
            const res = await api.post("/reservations", {
                schedule_id: selectedCourt.schedule_id, // Use schedule_id from selected court
                notes: "Booking via Wizard"
            });

            const { snap_token } = res.data;

            // B. Trigger Midtrans Snap
            if (window.snap) {
                const reservationId = res.data.reservation_id;
                // Note: Ensure backend returns reservation_id in response. Checked controller, it does: "reservation_id": reservation.ID

                window.snap.pay(snap_token, {
                    onSuccess: async function (result: any) {
                        try {
                            // Proactive update for localhost environment
                            await api.post(`/reservations/${reservationId}/mark-paid`);
                        } catch (e) {
                            console.error("Mark paid failed", e);
                        } finally {
                            router.push(`/reservations/success?id=${reservationId}`);
                        }
                    },
                    onPending: function (result: any) {
                        router.push(`/reservations/success?id=${reservationId}&status=pending`);
                    },
                    onError: function (result: any) {
                        setError("Payment failed. Please try again.");
                        setProcessing(false);
                    },
                    onClose: function () {
                        setError("Payment window closed. Please try again.");
                        setProcessing(false);
                    }
                });
            } else {
                setError("Payment system loading. Please wait a moment and try again.");
                setProcessing(false);
            }
        } catch (err: any) {
            setProcessing(false);
            if (err.response && err.response.status === 409) {
                setError("Sorry, this slot was just taken! Please restart.");
                // Optionally reset flow
            } else {
                setError(err.response?.data?.error || "System error.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-soft-white px-6 py-12 md:px-24">
            {/* Midtrans Script */}
            <Script
                src="https://app.sandbox.midtrans.com/snap/snap.js"
                data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
                strategy="lazyOnload"
            />

            <div className="mx-auto max-w-4xl">
                {/* Progress Bar */}
                <div className="mb-12">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <span className={`text-xs font-bold uppercase tracking-widest ${step >= 1 ? "text-primary" : "text-gray-300"}`}>Date</span>
                        <span className={`text-xs font-bold uppercase tracking-widest ${step >= 2 ? "text-primary" : "text-gray-300"}`}>Time</span>
                        <span className={`text-xs font-bold uppercase tracking-widest ${step >= 3 ? "text-primary" : "text-gray-300"}`}>Studio</span>
                        <span className={`text-xs font-bold uppercase tracking-widest ${step >= 4 ? "text-primary" : "text-gray-300"}`}>Confirm</span>
                    </div>
                    <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-in-out"
                            style={{ width: `${(step / 4) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Steps */}
                <div className="min-h-[400px]">
                    {step === 1 && (
                        <DateStep
                            selectedDate={selectedDate}
                            onSelect={setSelectedDate}
                            onNext={nextStep}
                        />
                    )}

                    {step === 2 && selectedDate && (
                        <TimeStep
                            selectedDate={selectedDate}
                            selectedTime={selectedTime}
                            onSelect={setSelectedTime}
                            onNext={nextStep}
                            onBack={prevStep}
                        />
                    )}

                    {step === 3 && selectedDate && selectedTime && (
                        <CourtStep
                            selectedDate={selectedDate}
                            selectedTime={selectedTime}
                            selectedCourt={selectedCourt}
                            onSelect={setSelectedCourt}
                            onNext={nextStep}
                            onBack={prevStep}
                        />
                    )}

                    {step === 4 && selectedDate && selectedTime && selectedCourt && (
                        <SummaryStep
                            selectedDate={selectedDate}
                            selectedTime={selectedTime}
                            selectedCourt={selectedCourt}
                            onConfirm={handleBook}
                            onBack={prevStep}
                            processing={processing}
                            error={error}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}