import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import {
  ADMIN_SESSION_COOKIE_NAME,
  createAdminSessionCookie,
  verifyAdminSessionCookie,
} from "@/lib/auth/admin";

const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 5;

interface AdminSessionPayload {
  idToken?: unknown;
}

function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  };
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value || null;
    const decodedSession = await verifyAdminSessionCookie(sessionCookie);

    if (!decodedSession) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      email: decodedSession.email || null,
      uid: decodedSession.uid,
    });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al validar la sesion admin");
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as AdminSessionPayload;
    const idToken = typeof payload.idToken === "string" ? payload.idToken.trim() : "";

    if (!idToken) {
      return NextResponse.json({ error: "Token no proporcionado." }, { status: 400 });
    }

    const sessionCookie = await createAdminSessionCookie(idToken);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_SESSION_COOKIE_NAME, sessionCookie, buildCookieOptions());
    return response;
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al crear la sesion admin");
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", {
    ...buildCookieOptions(),
    maxAge: 0,
  });
  return response;
}
