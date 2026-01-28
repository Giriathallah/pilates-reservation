import Link from "next/link";

export default function Footer() {
    return (
        <footer className="border-t border-dark-grey/5 bg-soft-white px-6 py-16 md:px-20">
            <div className="container-width">
                <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-4">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <span className="font-serif text-3xl font-bold text-primary">DIRO</span>
                        <p className="text-sm leading-relaxed text-dark-grey/50">
                            Modern, airy movement sanctuary for the conscious body. Elevating the standard of boutique pilates.
                        </p>
                        <div className="flex gap-4">
                            {["language", "camera", "mail"].map((icon) => (
                                <Link
                                    key={icon}
                                    href="#"
                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-dark-grey/10 text-primary transition-all hover:bg-primary hover:text-white"
                                >
                                    <span className="material-symbols-outlined text-sm">{icon}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Links Column */}
                    <div>
                        <h4 className="mb-6 text-sm font-bold uppercase tracking-widest">Explore</h4>
                        <ul className="space-y-4 text-sm text-dark-grey/60">
                            {["Class Schedule", "Membership Options", "Studio Policy", "Gift Cards"].map((link) => (
                                <li key={link}>
                                    <Link href="#" className="transition-colors hover:text-primary">
                                        {link}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Location Column */}
                    <div>
                        <h4 className="mb-6 text-sm font-bold uppercase tracking-widest">Location</h4>
                        <ul className="space-y-4 text-sm text-dark-grey/60">
                            <li>124 Movement St.</li>
                            <li>Greenwich Village</li>
                            <li>New York, NY 10012</li>
                            <li className="pt-2 font-bold text-primary cursor-pointer hover:underline">Directions</li>
                        </ul>
                    </div>

                    {/* Newsletter Column */}
                    <div>
                        <h4 className="mb-6 text-sm font-bold uppercase tracking-widest">Join Our List</h4>
                        <p className="mb-4 text-sm text-dark-grey/60">Stay updated on new classes and events.</p>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="Email address"
                                className="w-full rounded-full border border-dark-grey/10 bg-white px-6 py-3 text-sm focus:border-primary focus:outline-none"
                            />
                            <button className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90">
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-between gap-4 border-t border-dark-grey/5 pt-8 text-xs text-dark-grey/40 md:flex-row">
                    <p>© 2024 DIRO Pilates Studio. All rights reserved.</p>
                    <div className="flex gap-8">
                        <Link href="#" className="hover:text-primary">Privacy Policy</Link>
                        <Link href="#" className="hover:text-primary">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}