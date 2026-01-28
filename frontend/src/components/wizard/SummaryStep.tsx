"use client";

import { format } from "date-fns";

interface Court {
    court_id: string;
    schedule_id: string;
    court_name: string;
    price: number;
}

interface SummaryStepProps {
    selectedDate: Date;
    selectedTime: string;
    selectedCourt: Court;
    onConfirm: () => void;
    onBack: () => void;
    processing: boolean;
    error: string | null;
}

export default function SummaryStep({ selectedDate, selectedTime, selectedCourt, onConfirm, onBack, processing, error }: SummaryStepProps) {
    return (
        <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center">
                <h2 className="font-serif text-3xl text-dark-grey md:text-4xl">
                    Confirm Details
                </h2>
                <p className="mt-2 text-dark-grey/60">
                    Please review your booking before payment.
                </p>
            </div>

            <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <div className="space-y-6">
                    <div className="flex justify-between border-b border-gray-100 pb-4">
                        <span className="text-dark-grey/60 text-sm">Date</span>
                        <span className="font-bold text-dark-grey">{format(selectedDate, "EEEE, MMMM do, yyyy")}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-4">
                        <span className="text-dark-grey/60 text-sm">Time</span>
                        <span className="font-bold text-dark-grey">{selectedTime.substring(0, 5)} - {parseInt(selectedTime.substring(0, 2)) + 1}:00</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-4">
                        <span className="text-dark-grey/60 text-sm">Studio</span>
                        <span className="font-bold text-dark-grey">{selectedCourt.court_name}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-dark-grey/60 text-sm">Total Amount</span>
                        <span className="font-serif text-2xl font-bold text-primary">Rp {selectedCourt.price.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 max-w-md w-full text-center">
                    {error}
                </div>
            )}

            <div className="flex gap-4">
                <button
                    onClick={onBack}
                    disabled={processing}
                    className="rounded-full border border-dark-grey/20 px-8 py-3 text-sm font-bold text-dark-grey transition-all hover:bg-gray-50 disabled:opacity-50"
                >
                    Back
                </button>
                <button
                    onClick={onConfirm}
                    disabled={processing}
                    className="rounded-full bg-primary px-12 py-3 text-sm font-bold text-white transition-all hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none min-w-[180px] flex justify-center"
                >
                    {processing ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                        "Proceed to Payment"
                    )}
                </button>
            </div>
        </div>
    );
}
