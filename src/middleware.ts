// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SessionService } from "@/modules/auth/services/SessionService";
import { UserService } from "@/modules/auth/services/UserService";

// 🔹 Rutas protegidas por autenticación
const protectedRoutes = ["/dashboard", "/profile", "/account"];
// 🔹 Rutas exclusivas de admin
const adminRoutes = ["/admin"];

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  // 🔹 Extraer token desde cookie (BetterAuth guarda algo tipo `better-auth.session-token`)
  const token = req.cookies.get("better-auth.session-token")?.value;

  // Si no hay token y la ruta es protegida → redirigir a login
  if (!token && protectedRoutes.some((r) => url.pathname.startsWith(r))) {
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  if (token) {
    // Validar sesión
    const session = await SessionService.getSessionByToken(token);

    if (!session || !(await SessionService.isValidSession(token))) {
      // Sesión inválida → borrar cookie y redirigir
      const res = NextResponse.redirect(new URL("/sign-in", req.url));
      res.cookies.delete("better-auth.session-token");
      return res;
    }

    // Obtener usuario y validar estado
    const user = await UserService.getUserByEmail(session.userId);
    if (!user || user.status !== "active") {
      return NextResponse.redirect(new URL("/blocked", req.url));
    }

    // Verificar rol para rutas de admin
    if (
      adminRoutes.some((r) => url.pathname.startsWith(r)) &&
      user.role !== "admin"
    ) {
      return NextResponse.redirect(new URL("/forbidden", req.url));
    }
  }

  return NextResponse.next();
}

// 🔹 Configuración para aplicar middleware solo en rutas específicas
export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/account/:path*", "/admin/:path*"],
};
