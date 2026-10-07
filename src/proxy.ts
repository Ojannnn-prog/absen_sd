import { NextResponse } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';
import { jwtVerify } from 'jose';
import { AUTH_AUDIENCE, AUTH_ISSUER } from '@/lib/auth-constants';

function getAuthKey() {
  const secretKey = process.env.JWT_SECRET;
  if (!secretKey || secretKey.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }
  return new TextEncoder().encode(secretKey);
}

export default clerkMiddleware(async (auth, request) => {
  const path = request.nextUrl.pathname;

  const isAdminRoute = path.startsWith('/admin');
  const isStudentRoute = path.startsWith('/student');
  const isTeacherRoute = path.startsWith('/teacher');
  const isLoginRoute = path === '/login';

  const session = request.cookies.get('session')?.value;
  const clerkAuth = await auth();

  // Jika sudah login lokal dan mencoba akses halaman login, lempar ke dashboard
  if (isLoginRoute && session) {
    try {
      const { payload } = await jwtVerify(session, getAuthKey(), {
        algorithms: ["HS256"],
        issuer: AUTH_ISSUER,
        audience: AUTH_AUDIENCE,
      });
      if (payload.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (payload.role === 'teacher') {
        return NextResponse.redirect(new URL('/teacher', request.url));
      } else {
        return NextResponse.redirect(new URL('/student', request.url));
      }
    } catch (err) {
      // Jika token rusak, biarkan lanjut ke login
    }
  }

  // Proteksi rute yang butuh autentikasi
  if (isAdminRoute || isStudentRoute || isTeacherRoute) {
    // 1. Jika pengguna memiliki sesi lokal
    if (session) {
      try {
        const { payload } = await jwtVerify(session, getAuthKey(), {
          algorithms: ["HS256"],
          issuer: AUTH_ISSUER,
          audience: AUTH_AUDIENCE,
        });

        // Cek otorisasi role lokal
        if (isAdminRoute && payload.role !== 'admin') {
          return NextResponse.redirect(new URL('/', request.url));
        }
        if (isStudentRoute && payload.role !== 'student' && payload.role !== 'admin') {
          return NextResponse.redirect(new URL('/', request.url));
        }
        if (isTeacherRoute && payload.role !== 'teacher') {
          return NextResponse.redirect(new URL('/', request.url));
        }

        return NextResponse.next();
      } catch (err) {
        // Token tidak valid, cek apakah ada sesi Clerk
      }
    }

    // 2. Jika pengguna memiliki sesi Clerk (Google / OAuth)
    if (clerkAuth?.userId) {
      // Izinkan request lanjut ke Server Component, di mana getSession()
      // akan mengecek tautan akun, role, dan isolasi kelas di database
      return NextResponse.next();
    }

    // Jika tidak memiliki sesi lokal maupun sesi Clerk, alihkan ke login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Lewatkan file statis Next.js dan aset publik
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
