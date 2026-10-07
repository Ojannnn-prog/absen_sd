import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';
import { jwtVerify } from 'jose';
import { AUTH_AUDIENCE, AUTH_ISSUER } from '@/lib/auth-constants';

const CLERK_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_aGFuZHkta2luZ2Zpc2gtNjU1Ni5jbGVyay5hY2NvdW50cy5kZXYk";

const CLERK_SECRET_KEY =
  process.env.CLERK_SECRET_KEY ||
  "sk_test_xcRc9sw6Jh1CcZkj94EsEuOR1dNdmmzFpW8qRgUiJz";

function getAuthKey() {
  const secretKey = process.env.JWT_SECRET;
  if (!secretKey || secretKey.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }
  return new TextEncoder().encode(secretKey);
}

// Handler otentikasi lokal berbasis JWT cookie
async function handleLocalAuth(request: NextRequest, clerkUserId?: string | null) {
  const path = request.nextUrl.pathname;

  const isAdminRoute = path.startsWith('/admin');
  const isStudentRoute = path.startsWith('/student');
  const isTeacherRoute = path.startsWith('/teacher');
  const isLoginRoute = path === '/login';

  const session = request.cookies.get('session')?.value;

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
    } catch {
      // Jika token rusak, biarkan lanjut ke login
    }
  }

  // Proteksi rute yang butuh autentikasi
  if (isAdminRoute || isStudentRoute || isTeacherRoute) {
    // 1. Sesi lokal
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
      } catch {
        // Token tidak valid
      }
    }

    // 2. Sesi Clerk (OAuth)
    if (clerkUserId) {
      return NextResponse.next();
    }

    // Jika tidak ada sesi valid
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

const clerkHandler = clerkMiddleware(
  async (auth, request) => {
    try {
      const clerkAuth = await auth();
      return await handleLocalAuth(request as NextRequest, clerkAuth?.userId);
    } catch {
      return await handleLocalAuth(request as NextRequest, null);
    }
  },
  {
    publishableKey: CLERK_PUBLISHABLE_KEY,
    secretKey: CLERK_SECRET_KEY,
  }
);

export default async function proxy(request: NextRequest, event: any) {
  try {
    return await clerkHandler(request as any, event);
  } catch {
    // Fail-safe jika Clerk mengalami kendala jaringan atau environment
    return await handleLocalAuth(request, null);
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/student/:path*',
    '/teacher/:path*',
    '/login',
    '/sso-callback',
  ],
};
