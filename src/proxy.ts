import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { AUTH_AUDIENCE, AUTH_ISSUER } from '@/lib/auth-constants';

function getAuthKey() {
  const secretKey = process.env.JWT_SECRET;
  if (!secretKey || secretKey.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }
  return new TextEncoder().encode(secretKey);
}

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Rute yang butuh perlindungan
  const isAdminRoute = path.startsWith('/admin');
  const isStudentRoute = path.startsWith('/student');
  const isTeacherRoute = path.startsWith('/teacher');
  const isLoginRoute = path === '/login';

  const session = request.cookies.get('session')?.value;

  // Jika sudah login dan mencoba akses halaman login, lempar ke dashboard
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

  if (isAdminRoute || isStudentRoute || isTeacherRoute) {
    
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const { payload } = await jwtVerify(session, getAuthKey(), {
        algorithms: ["HS256"],
        issuer: AUTH_ISSUER,
        audience: AUTH_AUDIENCE,
      });
      
      // Cek otorisasi
      if (isAdminRoute && payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      if (isStudentRoute && payload.role !== 'student' && payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      if (isTeacherRoute && payload.role !== 'teacher') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      
    } catch (err) {
      // Token tidak valid atau kedaluwarsa
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/student/:path*', '/teacher/:path*', '/login'],
};
