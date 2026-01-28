"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Reservation {
    id: string;
    User: { name: string; email: string };
    Court: { name: string };
    Schedule: { date: string; start_time: string };
    payment?: { status: string };
    status: string;
    total_amount: number;
}

export default function ManageReservations() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReservations = async () => {
        try {
            const res = await api.get("/admin/reservations");
            setReservations(res.data.data);
        } catch (error) {
            console.error("Failed to fetch reservations", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    const handleCancel = async (id: string) => {
        if (!confirm("Are you sure you want to cancel this reservation?")) return;

        try {
            await api.post(`/admin/reservations/${id}/cancel`);
            fetchReservations();
            alert("Reservation cancelled");
        } catch (error) {
            alert("Failed to cancel reservation");
        }
    }

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Manage Reservations</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 font-medium text-gray-500">Booking ID</th>
                            <th className="p-4 font-medium text-gray-500">Customer</th>
                            <th className="p-4 font-medium text-gray-500">Schedule</th>
                            <th className="p-4 font-medium text-gray-500">Court</th>
                            <th className="p-4 font-medium text-gray-500">Payment</th>
                            <th className="p-4 font-medium text-gray-500">Status</th>
                            <th className="p-4 font-medium text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reservations.map((res) => (
                            <tr key={res.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                <td className="p-4 text-sm font-mono text-gray-600">
                                    {res.id.substring(0, 8)}...
                                </td>
                                <td className="p-4">
                                    <div className="font-medium">{res.User?.name}</div>
                                    <div className="text-sm text-gray-500">{res.User?.email}</div>
                                </td>
                                <td className="p-4">
                                    {res.Schedule ? (
                                        <>
                                            <div className="font-medium">{new Date(res.Schedule.date).toLocaleDateString()}</div>
                                            <div className="text-sm text-gray-500">{res.Schedule.start_time?.substring(0, 5)}</div>
                                        </>
                                    ) : <span className="text-red-500 text-sm">Invalid Schedule</span>}
                                </td>
                                <td className="p-4">
                                    <div className="font-medium">{res.Court?.name}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                                        ${res.payment?.status === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                                            res.payment?.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                                'bg-gray-100 text-gray-600'
                                        }`}>
                                        {res.payment?.status || 'N/A'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                        ${res.status === 'paid' ? 'bg-green-100 text-green-700' :
                                            res.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {res.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {res.status !== 'cancelled' && (
                                        <button
                                            onClick={() => handleCancel(res.id)}
                                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
