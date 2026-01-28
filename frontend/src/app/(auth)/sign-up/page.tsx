"use client";

import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import api from "@/lib/api";

const signUpSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignUpValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
    const { register: registerUser } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignUpValues>({
        resolver: zodResolver(signUpSchema),
    });

    const onSubmit = async (data: SignUpValues) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post("/auth/register", data);
            const { user } = response.data;
            registerUser(user);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to sign up");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col lg:flex-row">
            {/* Left Side - Hero Image */}
            <div className="relative hidden lg:block lg:w-1/2">
                <div className="absolute inset-0">
                    <Image
                        src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2940&auto=format&fit=crop"
                        alt="Pilates reformer class"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-white/5"></div>
                </div>
                <div className="absolute bottom-12 left-12 z-10 text-white">
                    <p className="font-serif text-2xl italic">Strengthen your core.</p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex w-full flex-col lg:w-1/2">
                <div className="flex items-center justify-between px-8 py-8 md:px-12 lg:px-16">
                    <span className="font-serif text-2xl font-bold tracking-tight text-primary">
                        DIRO
                    </span>
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm font-medium text-dark-grey/60 transition-colors hover:text-primary"
                    >
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Back to Home
                    </Link>
                </div>

                <div className="flex flex-1 flex-col justify-center px-8 pb-12 md:px-24 lg:px-32 xl:px-48">
                    <div className="mx-auto w-full max-w-md">
                        <div className="mb-10">
                            <h1 className="font-serif text-4xl font-normal text-dark-grey md:text-5xl">
                                Get Started.
                            </h1>
                            <p className="mt-4 font-light text-dark-grey/60">
                                Create an account to start your journey.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="mb-2 block text-xs font-bold uppercase tracking-widest text-dark-grey/40"
                                >
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    placeholder="Your Name"
                                    className={`w-full rounded-full border bg-soft-white px-6 py-4 text-sm transition-all focus:border-primary focus:outline-none ${errors.name ? "border-red-500" : "border-dark-grey/10"
                                        }`}
                                    {...register("name")}
                                />
                                {errors.name && (
                                    <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                                )}
                            </div>
                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-xs font-bold uppercase tracking-widest text-dark-grey/40"
                                >
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    className={`w-full rounded-full border bg-soft-white px-6 py-4 text-sm transition-all focus:border-primary focus:outline-none ${errors.email ? "border-red-500" : "border-dark-grey/10"
                                        }`}
                                    {...register("email")}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                                )}
                            </div>
                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-2 block text-xs font-bold uppercase tracking-widest text-dark-grey/40"
                                >
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className={`w-full rounded-full border bg-soft-white px-6 py-4 text-sm transition-all focus:border-primary focus:outline-none ${errors.password ? "border-red-500" : "border-dark-grey/10"
                                        }`}
                                    {...register("password")}
                                />
                                {errors.password && (
                                    <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                                )}
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex w-full items-center justify-center rounded-full bg-primary py-4 text-base font-bold tracking-wide text-white transition-all hover:scale-[1.01] hover:bg-primary/90 hover:shadow-lg active:scale-[0.99] disabled:opacity-70"
                                >
                                    {isLoading ? "Creating Account..." : "Create Account"}
                                </button>
                            </div>
                        </form>

                        <div className="mt-12 text-center">
                            <p className="text-sm text-dark-grey/60">
                                Already have an account?{" "}
                                <Link
                                    href="/sign-in"
                                    className="ml-1 font-bold text-primary hover:underline"
                                >
                                    Sign in.
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-dark-grey/5 px-8 py-8 text-center lg:hidden">
                    <p className="text-xs text-dark-grey/40">© 2024 DIRO Pilates Studio</p>
                </div>
            </div>
        </div>
    );
}