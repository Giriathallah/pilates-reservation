"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    const links = [
        { href: "/admin/dashboard", label: "Dashboard" },
        { href: "/admin/courts", label: "Courts" },
        { href: "/admin/schedules", label: "Schedules" },
        { href: "/admin/reservations", label: "Reservations" },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
                </div>
                <nav className="mt-4 px-4 space-y-2">
                    {links.map((link) => {
                        const isActive = pathname.startsWith(link.href);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? "bg-black text-white"
                                        : "text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
                    <Link
                        href="/dashboard"
                        className="block w-full px-4 py-2 text-center text-sm text-gray-600 hover:text-black"
                    >
                        ← Back to App
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
