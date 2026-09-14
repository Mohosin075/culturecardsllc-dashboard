import { NextRequest, NextResponse } from "next/server";

// Routes that don't need a token
const PUBLIC_ROUTES = [
  "/login",
  "/forgot",
  "/reset-password",
  "/partner/dashboard",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get("admin_access_token")?.value;

  // Not logged in -> trying to access protected route -> redirect to /login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export function proxy(request: NextRequest) {
  return middleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
