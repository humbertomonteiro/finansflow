import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./src/infra/services/firebaseConfig";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedRoutes = [
    "/settings",
    "/performance",
    "/dashboard",
    "/transactions",
  ];

  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    const user = await new Promise((resolve) => {
      auth.onAuthStateChanged((user) => resolve(user));
    });

    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/settings/:path*",
    "/performance/:path*",
    "/dashboard/:path*",
    "/transactions/:path*",
  ],
};
