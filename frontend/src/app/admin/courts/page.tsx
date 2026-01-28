"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Court {
    id: string;
    name: string;
    description: string;
    capacity: number;
    price_per_slot: number;
}

export default function ManageCourts() {
    const [courts, setCourts] = useState<Court[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        capacity: 1,
        price_per_slot: 0,
    });

    const fetchCourts = async () => {
        try {
            const res = await api.get("/admin/courts");
            setCourts(res.data.data);
        } catch (error) {
            console.error("Failed to fetch courts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(
                "/admin/courts",
                { ...formData, capacity: Number(formData.capacity), price_per_slot: Number(formData.price_per_slot) }
            );
            setShowModal(false);
            fetchCourts();
            setFormData({ name: "", description: "", capacity: 1, price_per_slot: 0 }); // Reset
        } catch (error) {
            alert("Failed to create court");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;

        try {
            await api.delete(`/admin/courts/${id}`);
            fetchCourts();
        } catch (error) {
            alert("Failed to delete court");
        }
    }

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manage Courts</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                >
                    + Add Court
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 font-medium text-gray-500">Name</th>
                            <th className="p-4 font-medium text-gray-500">Description</th>
                            <th className="p-4 font-medium text-gray-500">Capacity</th>
                            <th className="p-4 font-medium text-gray-500">Price</th>
                            <th className="p-4 font-medium text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courts.map((court) => (
                            <tr key={court.id} className="border-b border-gray-100 last:border-0">
                                <td className="p-4">{court.name}</td>
                                <td className="p-4 text-gray-500">{court.description}</td>
                                <td className="p-4">{court.capacity}</td>
                                <td className="p-4">Rp {court.price_per_slot.toLocaleString()}</td>
                                <td className="p-4">
                                    <button onClick={() => handleDelete(court.id)} className="text-red-500 hover:text-red-700">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Add New Court</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <input
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Capacity</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Price</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.price_per_slot}
                                        onChange={(e) => setFormData({ ...formData, price_per_slot: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 p-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 p-2 bg-black text-white rounded-lg hover:bg-gray-800"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
