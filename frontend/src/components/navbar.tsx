import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = () => {
        logout();
        router.push("/sign-in");
    };

    return (
        <nav className="fixed top-0 z-50 w-full px-6 py-4 md:px-20">
            <div className="container-width flex items-center justify-between rounded-full border border-white/20 bg-white/70 px-8 py-3 backdrop-blur-md ethereal-shadow">
                <div className="flex items-center gap-2">
                    <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-primary">
                        DIRO
                    </Link>
                </div>

                <div className="hidden items-center gap-8 md:flex">
                    {!user ? (
                        <>
                            {["Classes", "Studio", "Instructors", "Pricing"].map((item) => (
                                <Link
                                    key={item}
                                    href={`/#${item.toLowerCase()}`}
                                    className="text-sm font-medium transition-colors hover:text-primary"
                                >
                                    {item}
                                </Link>
                            ))}
                        </>
                    ) : (
                        <>
                            <Link
                                href="/"
                                className={`text-sm font-medium transition-colors hover:text-primary ${pathname === "/" ? "text-primary font-semibold" : "text-gray-600"}`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/bookings"
                                className={`text-sm font-medium transition-colors hover:text-primary ${pathname === "/bookings" ? "text-primary font-semibold" : "text-gray-600"}`}
                            >
                                My Bookings
                            </Link>
                            <Link
                                href="/profile"
                                className={`text-sm font-medium transition-colors hover:text-primary ${pathname === "/profile" ? "text-primary font-semibold" : "text-gray-600"}`}
                            >
                                Profile
                            </Link>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {!user ? (
                        <Link href="/sign-in">
                            <button className="flex items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-bold tracking-wide text-white transition-all hover:scale-[1.02] hover:bg-primary/90">
                                Sign In
                            </button>
                        </Link>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link href="/reserve">
                                <button className="hidden sm:flex items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-bold tracking-wide text-white transition-all hover:scale-[1.02] hover:bg-primary/90">
                                    Book Now
                                </button>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="text-sm font-medium text-gray-600 hover:text-red-500 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}