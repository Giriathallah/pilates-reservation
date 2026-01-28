"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Schedule {
    id: string;
    date: string; // YYYY-MM-DDT00:00:00Z
    start_time: string;
    end_time: string;
    is_available: boolean;
    Court: { name: string };
}
interface Court {
    id: string;
    name: string;
}

const timeSlots = [
    "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
    "19:00", "20:00", "21:00"
];

function getWeekDates(startDate: Date) {
    const dates = [];
    // Adjust to Monday
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(startDate.setDate(diff));

    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(d);
    }
    return dates;
}

export default function ManageSchedules() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [courts, setCourts] = useState<Court[]>([]);
    const [selectedCourtId, setSelectedCourtId] = useState<string>("");

    // Calendar state
    const [currentDate, setCurrentDate] = useState(new Date()); // Viewing week of this date
    const [weekDates, setWeekDates] = useState<Date[]>([]);

    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Generate Form
    const [formData, setFormData] = useState({
        court_id: "",
        start_date: "",
        end_date: "",
        start_time: "09:00",
        end_time: "10:00",
        duration: 60,
    });

    useEffect(() => {
        setWeekDates(getWeekDates(new Date(currentDate)));
    }, [currentDate]);

    const fetchCourts = async () => {
        try {
            const res = await api.get("/admin/courts");
            setCourts(res.data.data);
            if (res.data.data.length > 0 && !selectedCourtId) {
                setSelectedCourtId(res.data.data[0].id);
                setFormData(prev => ({ ...prev, court_id: res.data.data[0].id }));
            }
        } catch (e) {
            console.error("Fetch courts failed", e);
        }
    };

    const fetchSchedules = async () => {
        if (!selectedCourtId || weekDates.length === 0) return;

        setLoading(true);
        const startStr = weekDates[0].toISOString().split('T')[0];
        const endStr = weekDates[6].toISOString().split('T')[0];

        try {
            const res = await api.get(`/admin/schedules?court_id=${selectedCourtId}&start_date=${startStr}&end_date=${endStr}`);
            setSchedules(res.data.data);
        } catch (error) {
            console.error("Failed to fetch schedules", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourts();
    }, []);

    useEffect(() => {
        if (selectedCourtId && weekDates.length > 0) {
            fetchSchedules();
        }
    }, [selectedCourtId, weekDates]);


    const handlePrevWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 7);
        setCurrentDate(d);
    }

    const handleNextWeek = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + 7);
        setCurrentDate(d);
    }

    const toggleAvailability = async (schedule: Schedule) => {
        try {
            await api.put(`/admin/schedules/${schedule.id}`, {
                is_available: !schedule.is_available
            });
            fetchSchedules(); // Refresh
        } catch (error) {
            alert("Failed to update schedule");
        }
    };

    const handleBulkCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post("/admin/schedules/bulk", formData);
            setShowModal(false);
            fetchSchedules();
            alert("Schedules generated!");
        } catch (error) {
            alert("Failed to create schedules");
        }
    };

    // Check if a slot exists for a given day and time (rough match by HH:00)
    const getSlot = (date: Date, time: string) => {
        if (!schedules) return undefined;
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

        return schedules.find(s => {
            const sDate = s.date.split('T')[0];
            const sTime = s.start_time.substring(0, 5); // HH:MM
            return sDate === dateStr && sTime === time;
        });
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold">Manage Schedules</h1>

                <div className="flex gap-2">
                    <select
                        className="p-2 border rounded-lg bg-white"
                        value={selectedCourtId}
                        onChange={(e) => {
                            setSelectedCourtId(e.target.value);
                            setFormData(prev => ({ ...prev, court_id: e.target.value }));
                        }}
                    >
                        {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 text-sm"
                    >
                        + Generate Slots
                    </button>
                </div>
            </div>

            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-xl border border-gray-100">
                <button onClick={handlePrevWeek} className="p-2 hover:bg-gray-100 rounded-lg">← Prev Week</button>
                <div className="font-medium">
                    {weekDates.length > 0 && `Week of ${weekDates[0].toLocaleDateString()}`}
                </div>
                <button onClick={handleNextWeek} className="p-2 hover:bg-gray-100 rounded-lg">Next Week →</button>
            </div>

            {/* Weekly Calendar Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* Header */}
                    <div className="grid grid-cols-8 border-b text-center bg-gray-50">
                        <div className="p-3 font-medium text-gray-500 border-r">Time</div>
                        {weekDates.map((d, i) => (
                            <div key={i} className="p-3 border-r font-medium">
                                <div className="text-sm text-gray-500">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                <div className="text-lg font-bold">{d.getDate()}</div>
                            </div>
                        ))}
                    </div>

                    {/* Body */}
                    {timeSlots.map(time => (
                        <div key={time} className="grid grid-cols-8 border-b last:border-0 h-16">
                            <div className="p-2 text-xs text-center text-gray-400 border-r flex items-center justify-center bg-gray-50/50">
                                {time}
                            </div>
                            {weekDates.map((date, i) => {
                                const slot = getSlot(date, time);
                                return (
                                    <div key={i} className="border-r p-1 relative group">
                                        {slot ? (
                                            <button
                                                onClick={() => toggleAvailability(slot)}
                                                className={`w-full h-full rounded-md text-xs font-medium flex items-center justify-center transition-all
                                                    ${slot.is_available
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-red-100 text-red-700 hover:bg-red-200'}
                                                `}
                                                title={slot.is_available ? "Click to Close" : "Click to Open"}
                                            >
                                                {slot.is_available ? "Open" : "Closed"}
                                            </button>
                                        ) : (
                                            <div className="w-full h-full bg-gray-50/30"></div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Generate Schedules</h2>
                        <form onSubmit={handleBulkCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Target Court</label>
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                    {courts.find(c => c.id === formData.court_id)?.name || 'Loading...'}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Start Date</label>
                                    <input type="date" className="w-full p-2 border rounded-lg"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">End Date</label>
                                    <input type="date" className="w-full p-2 border rounded-lg"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Start Time</label>
                                    <input type="time" className="w-full p-2 border rounded-lg"
                                        value={formData.start_time}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">End Time</label>
                                    <input type="time" className="w-full p-2 border rounded-lg"
                                        value={formData.end_time}
                                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
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
                                    Generate
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
