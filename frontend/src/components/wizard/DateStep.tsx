"use client";

import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "@/lib/api";
import { addDays } from "date-fns";

interface DateStepProps {
    selectedDate: Date | null;
    onSelect: (date: Date) => void;
    onNext: () => void;
}

export default function DateStep({ selectedDate, onSelect, onNext }: DateStepProps) {
    const [availableDates, setAvailableDates] = useState<Date[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDates = async () => {
            try {
                const res = await api.get("/dates/available");
                // Convert string "YYYY-MM-DD" to Date objects
                // Set tome to midnight to match DatePicker comparison
                const dates = (res.data.dates || []).map((d: string) => {
                    const [year, month, day] = d.split('-').map(Number);
                    return new Date(year, month - 1, day);
                });
                setAvailableDates(dates);
            } catch (error) {
                console.error("Failed to load dates", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDates();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
                <h2 className="font-serif text-3xl text-dark-grey md:text-4xl">
                    Choose a Date
                </h2>
                <p className="mt-2 text-dark-grey/60">
                    Select a day to view available sessions.
                </p>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                <style>{`
          .react-datepicker {
             border: none;
             font-family: var(--font-manrope);
          }
          .react-datepicker__header {
             background-color: white;
             border-bottom: 1px solid #f3f4f6;
          }
          .react-datepicker__day--selected {
             background-color: var(--color-primary) !important;
             border-radius: 50%;
          }
          .react-datepicker__day--keyboard-selected {
             background-color: var(--color-primary) !important;
             border-radius: 50%;
          }
          .react-datepicker__day:hover {
             border-radius: 50%;
          }
        `}</style>
                {loading ? (
                    <div className="h-[300px] w-[300px] flex items-center justify-center">
                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date) => date && onSelect(date)}
                        inline
                        minDate={new Date()}
                        maxDate={addDays(new Date(), 30)}
                        includeDates={availableDates}
                        placeholderText="Select a date"
                    />
                )}
            </div>

            <button
                onClick={onNext}
                disabled={!selectedDate}
                className="rounded-full bg-primary px-12 py-3 text-sm font-bold text-white transition-all hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
            >
                Next Step
            </button>
        </div>
    );
}
