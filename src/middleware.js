// src/middleware.js  (en la raíz de src/, al mismo nivel que app/)
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Rutas de admin — solo rol_id === 1
    if (pathname.startsWith("/api/admin") || pathname.startsWith("/admin")) {
      if (token?.rol_id !== 1) {
        // Si es una API, retorna JSON
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }
        // Si es una página, redirige
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // authorized se llama primero — si retorna false, redirige al login
      authorized: ({ token }) => !!token,
    },
  }
);

// Define qué rutas protege el middleware
export const config = {
  matcher: [
    // Protege todas las rutas API excepto auth, login y registro
    "/api/((?!auth|login|registro).*)",
    // Protege todas las páginas excepto login y registro
    "/((?!login|registro|_next/static|_next/image|favicon.ico).*)",
  ],
};