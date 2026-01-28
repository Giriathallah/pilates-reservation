"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation"; // tambah usePathname
import api from "@/lib/api";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isAdmin: boolean;
    login: (user: User) => void;
    register: (user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname(); // untuk cek path saat ini

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await api.get("/auth/me");
                const fetchedUser = response.data.user as User;
                setUser(fetchedUser);

                // Role-based redirect saat load/refresh
                if (fetchedUser.role === "admin") {
                    // Jika admin sedang di halaman user biasa → redirect ke admin
                    if (!pathname.startsWith("/admin")) {
                        router.replace("/admin/dashboard");
                    }
                } else {
                    // Jika user biasa sedang di halaman admin → redirect ke home
                    if (pathname.startsWith("/admin")) {
                        router.replace("/");
                    }
                }
            } catch (error: any) {
                console.error("Check auth failed:", error);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [pathname, router]); // tambah pathname & router ke dependency

    const login = (newUser: User) => {
        setUser(newUser);

        // Redirect berdasarkan role saat login
        if (newUser.role === "admin") {
            router.push("/admin/dashboard");
        } else {
            router.push("/");
        }
        router.refresh();
    };

    const register = (newUser: User) => {
        login(newUser); // register biasanya ke user biasa, tapi jika backend return role admin (jarang), handle sama
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
            setUser(null);
            router.push("/sign-in");
            router.refresh();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const isAdmin = user?.role === "admin";

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                isAdmin,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};