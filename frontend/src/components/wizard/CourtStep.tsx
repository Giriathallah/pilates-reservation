"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { format } from "date-fns";

interface Court {
    court_id: string; // From API response
    schedule_id: string;
    court_name: string;
    price: number;
    capacity: number;
}

interface CourtStepProps {
    selectedDate: Date;
    selectedTime: string;
    selectedCourt: Court | null;
    onSelect: (court: Court) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function CourtStep({ selectedDate, selectedTime, selectedCourt, onSelect, onNext, onBack }: CourtStepProps) {
    const [courts, setCourts] = useState<Court[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourts = async () => {
            setLoading(true);
            try {
                const dateStr = format(selectedDate, "yyyy-MM-dd");
                const res = await api.get(`/courts/available?date=${dateStr}&time=${selectedTime}`);
                setCourts(res.data.courts || []);
            } catch (error) {
                console.error("Failed to load courts", error);
            } finally {
                setLoading(false);
            }
        };

        if (selectedDate && selectedTime) fetchCourts();
    }, [selectedDate, selectedTime]);

    return (
        <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center">
                <h2 className="font-serif text-3xl text-dark-grey md:text-4xl">
                    Choose Your Spot
                </h2>
                <p className="mt-2 text-dark-grey/60">
                    {format(selectedDate, "MMM d")} at {selectedTime.substring(0, 5)}
                </p>
            </div>

            <div className="w-full max-w-2xl">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                ) : courts.length === 0 ? (
                    <div className="text-center py-12 text-dark-grey/50">
                        No courts available.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {courts.map((court) => (
                            <div
                                key={court.court_id}
                                onClick={() => onSelect(court)}
                                className={`group cursor-pointer relative overflow-hidden rounded-2xl border bg-white p-6 transition-all hover:shadow-lg
                            ${selectedCourt?.court_id === court.court_id
                                        ? "border-primary ring-1 ring-primary shadow-md"
                                        : "border-gray-200 hover:border-primary/50"
                                    }
                        `}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-serif text-xl font-bold text-dark-grey group-hover:text-primary transition-colors">
                                        {court.court_name}
                                    </h3>
                                    {selectedCourt?.court_id === court.court_id && (
                                        <span className="material-symbols-outlined text-primary">check_circle</span>
                                    )}
                                </div>

                                <p className="text-sm text-dark-grey/60 mb-6">
                                    Premium reformer pilates experience. {court.capacity} person capacity.
                                </p>

                                <div className="flex items-center justify-between mt-auto">
                                    <span className="font-bold text-lg text-dark-grey">Rp {court.price.toLocaleString()}</span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-primary/80 bg-primary/5 px-3 py-1 rounded-full">
                                        Standard
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex gap-4">
                <button
                    onClick={onBack}
                    className="rounded-full border border-dark-grey/20 px-8 py-3 text-sm font-bold text-dark-grey transition-all hover:bg-gray-50"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!selectedCourt}
                    className="rounded-full bg-primary px-12 py-3 text-sm font-bold text-white transition-all hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                >
                    Next Step
                </button>
            </div>
        </div>
    );
}
