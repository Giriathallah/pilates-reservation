import Link from "next/link";
import Image from "next/image";

export default function LandingPageContent() {
    return (
        <main>
            {/* Hero Section */}
            <section className="relative flex min-h-screen items-center justify-center px-6 pt-20 md:px-20">
                <div className="container-width w-full">
                    <div className="relative overflow-hidden rounded-xl bg-accent-lavender ethereal-shadow">
                        {/* Background Image with Overlay */}
                        <div className="absolute inset-0 z-0">
                            <Image
                                src="https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=2940&auto=format&fit=crop"
                                alt="Person stretching in a bright minimalist pilates studio"
                                fill
                                className="object-cover object-center"
                                priority
                            />
                            {/* Custom Gradient Overlay to match design */}
                            <div
                                className="absolute inset-0 bg-linear-to-r from-white/90 via-white/40 to-transparent"
                            />
                        </div>

                        {/* Content */}
                        <div className="relative z-10 flex min-h-[700px] flex-col items-start justify-center p-8 md:p-20">
                            <div className="max-w-xl space-y-6">
                                <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-primary/70">
                                    Welcome to Diro
                                </h4>
                                <h1 className="font-serif text-5xl font-normal leading-[1.1] text-dark-grey md:text-7xl">
                                    Elevate Your <br />
                                    <span className="italic">Movement</span>
                                </h1>
                                <p className="text-lg font-light leading-relaxed text-dark-grey/80 md:text-xl">
                                    Discover your strength in our calming pilates sanctuary. A boutique approach to movement designed to align your mind and body.
                                </p>
                                <div className="pt-4">
                                    <Link
                                        href="/sign-up"
                                        className="flex w-fit items-center justify-center rounded-full bg-primary px-10 py-4 text-base font-bold tracking-wide text-white transition-all hover:scale-[1.02] hover:shadow-lg"
                                    >
                                        Reserve Your Mat
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Philosophy Section */}
            <section className="px-6 py-32 md:px-20">
                <div className="container-width">
                    <div className="mb-20 flex flex-col items-center space-y-4 text-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">
                            The Diro Method
                        </span>
                        <h2 className="font-serif text-4xl text-dark-grey md:text-5xl">
                            Balance, Breath, and Precision
                        </h2>
                        <div className="h-px w-20 bg-primary/20"></div>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        {[
                            { icon: "self_improvement", title: "Mindful Movement", desc: "Focus on every breath and alignment for a deeper connection between body and spirit." },
                            { icon: "fitness_center", title: "Modern Equipment", desc: "State-of-the-art reformers and props designed to challenge and support your journey." },
                            { icon: "verified_user", title: "Expert Guidance", desc: "Our certified instructors offer personalized adjustments in every session." },
                        ].map((feature, idx) => (
                            <div
                                key={idx}
                                className="group flex flex-col items-center rounded-xl bg-white p-10 ethereal-shadow transition-transform hover:-translate-y-2"
                            >
                                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent-lavender text-primary">
                                    <span className="material-symbols-outlined text-3xl">
                                        {feature.icon}
                                    </span>
                                </div>
                                <h3 className="mb-3 text-xl font-bold">{feature.title}</h3>
                                <p className="text-center leading-relaxed text-dark-grey/60">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Classes Section */}
            <section className="bg-accent-lavender/40 px-6 py-24 md:px-20">
                <div className="container-width">
                    <div className="mb-16 flex flex-col items-end justify-between gap-6 md:flex-row">
                        <div className="max-w-xl">
                            <h2 className="mb-4 font-serif text-4xl text-dark-grey md:text-5xl">
                                Explore Our Classes
                            </h2>
                            <p className="text-dark-grey/70">
                                From foundational mat work to advanced reformer flows, we have a space for every level of experience.
                            </p>
                        </div>
                        <Link
                            href="#"
                            className="border-b-2 border-primary/20 pb-1 text-sm font-bold text-primary transition-colors hover:border-primary"
                        >
                            View All Class Types
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[
                            { title: "Signature Reformer", desc: "A full-body flow focused on strength and length.", img: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=2940&auto=format&fit=crop" },
                            { title: "Core Matwork", desc: "The fundamentals of control, precision, and core stability.", img: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2940&auto=format&fit=crop" },
                            { title: "Private Studio", desc: "One-on-one tailored sessions for your unique goals.", img: "https://images.unsplash.com/photo-1544367563-12123d8965cd?q=80&w=2940&auto=format&fit=crop" },
                        ].map((cls, idx) => (
                            <div key={idx} className="group relative h-[450px] overflow-hidden rounded-xl ethereal-shadow">
                                <Image
                                    src={cls.img}
                                    alt={cls.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent"></div>
                                <div className="absolute bottom-0 w-full p-8">
                                    <h3 className="mb-2 font-serif text-2xl text-white">{cls.title}</h3>
                                    <p className="mb-4 text-sm text-white/80">{cls.desc}</p>
                                    <button className="rounded-full border border-white/30 bg-white/20 px-6 py-2 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md transition-all hover:bg-white hover:text-primary">
                                        Book Class
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonial Section */}
            <section className="bg-white px-6 py-32 md:px-20">
                <div className="mx-auto max-w-4xl text-center">
                    <span className="material-symbols-outlined mb-8 text-5xl text-primary/20">
                        format_quote
                    </span>
                    <p className="mb-10 font-serif text-3xl leading-relaxed text-dark-grey italic md:text-4xl">
                        &quot;Diro is my morning escape. The studio is so light and airy, and I always leave feeling three inches taller and completely grounded. It&apos;s truly a boutique experience.&quot;
                    </p>
                    <div className="flex flex-col items-center">
                        <div className="mb-4 h-14 w-14 overflow-hidden rounded-full bg-accent-lavender">
                            <Image
                                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2940&auto=format&fit=crop"
                                alt="Sarah J."
                                width={56}
                                height={56}
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <span className="font-bold text-dark-grey">Sarah Jensen</span>
                        <span className="text-sm uppercase tracking-widest text-dark-grey/50">
                            Member since 2022
                        </span>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="px-6 py-24 md:px-20">
                <div className="container-width relative overflow-hidden rounded-xl bg-primary p-12 text-center text-white md:p-24">
                    {/* Abstract patterns */}
                    <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5"></div>
                    <div className="absolute bottom-0 left-0 h-96 w-96 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/5"></div>

                    <div className="relative z-10 space-y-8">
                        <h2 className="font-serif text-4xl md:text-6xl">
                            Begin Your Journey Today
                        </h2>
                        <p className="mx-auto max-w-xl text-lg text-white/80">
                            First class is only $25. Discover what Diro Pilates can do for your mind and body.
                        </p>
                        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Link
                                href="/sign-up"
                                className="w-full rounded-full bg-white px-10 py-4 font-bold text-primary transition-all hover:shadow-xl sm:w-auto"
                            >
                                Get Started
                            </Link>
                            <button className="w-full rounded-full border border-white/30 bg-transparent px-10 py-4 font-bold text-white transition-all hover:bg-white/10 sm:w-auto">
                                Contact Studio
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
