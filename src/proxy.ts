import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || "rahasia-super-aman-sistem-absensi-sdn";
const key = new TextEncoder().encode(secretKey);

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Rute yang butuh perlindungan
  const isAdminRoute = path.startsWith('/admin');
  const isStudentRoute = path.startsWith('/student');
  const isLoginRoute = path === '/login';

  const session = request.cookies.get('session')?.value;

  // Jika sudah login dan mencoba akses halaman login, lempar ke dashboard
  if (isLoginRoute && session) {
    try {
      const { payload } = await jwtVerify(session, key, { algorithms: ["HS256"] });
      if (payload.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else {
        return NextResponse.redirect(new URL('/student', request.url));
      }
    } catch (err) {
      // Jika token rusak, biarkan lanjut ke login
    }
  }

  if (isAdminRoute || isStudentRoute) {
    
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const { payload } = await jwtVerify(session, key, { algorithms: ["HS256"] });
      
      // Cek otorisasi
      if (isAdminRoute && payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      if (isStudentRoute && payload.role !== 'student' && payload.role !== 'admin') {
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
  matcher: ['/admin/:path*', '/student/:path*', '/login'],
};
