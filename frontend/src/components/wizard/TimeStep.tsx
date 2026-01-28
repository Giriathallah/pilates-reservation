"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { format } from "date-fns";

interface TimeStepProps {
    selectedDate: Date;
    selectedTime: string | null;
    onSelect: (time: string) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function TimeStep({ selectedDate, selectedTime, onSelect, onNext, onBack }: TimeStepProps) {
    const [timeSlots, setTimeSlots] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTimeSlots = async () => {
            setLoading(true);
            try {
                const dateStr = format(selectedDate, "yyyy-MM-dd");
                const res = await api.get(`/timeslots?date=${dateStr}`);
                setTimeSlots(res.data.time_slots || []);
            } catch (error) {
                console.error("Failed to load time slots", error);
            } finally {
                setLoading(false);
            }
        };

        if (selectedDate) fetchTimeSlots();
    }, [selectedDate]);

    return (
        <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center">
                <h2 className="font-serif text-3xl text-dark-grey md:text-4xl">
                    Select a Time
                </h2>
                <p className="mt-2 text-dark-grey/60">
                    Available slots for {format(selectedDate, "EEEE, MMMM do")}.
                </p>
            </div>

            <div className="w-full max-w-md">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                ) : timeSlots.length === 0 ? (
                    <div className="text-center py-12 text-dark-grey/50">
                        No slots available for this date.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {timeSlots.map((time) => (
                            <button
                                key={time}
                                onClick={() => onSelect(time)}
                                className={`rounded-xl border py-4 text-sm font-bold transition-all
                            ${selectedTime === time
                                        ? "border-primary bg-primary text-white shadow-md transform scale-105"
                                        : "border-gray-200 bg-white text-dark-grey hover:border-primary/50 hover:shadow-sm"
                                    }
                        `}
                            >
                                {time.substring(0, 5)}
                            </button>
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
                    disabled={!selectedTime}
                    className="rounded-full bg-primary px-12 py-3 text-sm font-bold text-white transition-all hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                >
                    Next Step
                </button>
            </div>
        </div>
    );
}
