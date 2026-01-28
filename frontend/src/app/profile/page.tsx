"use client";

import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const router = useRouter();

    if (!user) {
        return null; // or loading state, middleware redirects anyway
    }

    const handleLogout = () => {
        logout();
        router.push("/sign-in");
    };

    return (
        <main className="min-h-screen bg-soft-white flex flex-col">
            <Navbar />

            <div className="grow pt-32 pb-20 px-6 md:px-20">
                <div className="container-width max-w-3xl mx-auto">
                    <div className="mb-8 text-center md:text-left">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-primary/70 mb-2">
                            My Account
                        </h4>
                        <h1 className="font-serif text-4xl text-dark-grey md:text-5xl">
                            Profile
                        </h1>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        {/* Header Banner */}
                        <div className="h-32 bg-linear-to-r from-primary/10 to-accent-lavender/30"></div>

                        <div className="px-8 pb-8 relative">
                            {/* Avatar */}
                            <div className="-mt-16 mb-6 flex justify-center md:justify-start">
                                <div className="h-32 w-32 rounded-full border-4 border-white bg-accent-lavender flex items-center justify-center text-primary font-bold text-5xl shadow-md">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Full Name</label>
                                        <p className="text-lg font-medium text-dark-grey">{user.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Email Address</label>
                                        <p className="text-lg font-medium text-dark-grey">{user.email}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Account Type</label>
                                        <p className="text-lg font-medium text-dark-grey capitalize">{user.role}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase tracking-wide text-gray-500">Member Since</label>
                                        <p className="text-lg font-medium text-dark-grey">January 2024</p> {/* Placeholder */}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
                                    <Link href="/bookings" className="flex-1">
                                        <button className="w-full rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-dark-grey transition-all hover:border-primary/50 hover:text-primary hover:shadow-sm">
                                            View My Bookings
                                        </button>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex-1 rounded-xl bg-red-50 px-6 py-3 text-sm font-bold text-red-600 transition-all hover:bg-red-100"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
