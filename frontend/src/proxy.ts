// src/proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const token = request.cookies.get('token')?.value;

    // Daftar path yang protected (sesuaikan dengan app Anda)
    const protectedPaths = ['/reserve', '/bookings', '/profile', '/dashboard', '/admin'];

    const pathname = request.nextUrl.pathname;

    // Jika akses protected path tapi tidak ada token → redirect ke sign-in
    if (protectedPaths.some(path => pathname.startsWith(path)) && !token) {
        const loginUrl = new URL('/sign-in', request.url);
        loginUrl.searchParams.set('from', pathname); // optional: redirect back setelah login
        return NextResponse.redirect(loginUrl);
    }

    // Jika ada token, lanjutkan (backend akan validasi)
    return NextResponse.next();
}

// Config matcher: jalankan hanya di path tertentu (performance penting!)
export const config = {
    matcher: [
        '/reserve/:path*',
        '/bookings/:path*',
        '/profile/:path*',
        '/dashboard/:path*',
        '/admin/:path*',
        // tambah path lain yang butuh auth
        // '/((?!sign-in|sign-up|api|_next/static|_next/image|favicon.ico).*)' // optional: semua kecuali public
    ],
};