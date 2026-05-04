import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { ensureCommerceFeatureEnabled } from "@/lib/commerce-mode";
import { ensureCustomerProfile } from "@/lib/customer/service";
import {
  createCustomerSessionCookie,
  CUSTOMER_SESSION_COOKIE_NAME,
  verifyCustomerIdToken,
  verifyCustomerSessionCookie,
} from "@/lib/auth/customer";

const CUSTOMER_COOKIE_MAX_AGE = 60 * 60 * 24 * 5;

interface CustomerSessionPayload {
  idToken?: unknown;
}

function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CUSTOMER_COOKIE_MAX_AGE,
  };
}

export async function GET() {
  try {
    ensureCommerceFeatureEnabled("userAccounts", "Las cuentas de usuario no estan habilitadas en modo catalogo.");
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(CUSTOMER_SESSION_COOKIE_NAME)?.value || null;
    const decodedSession = await verifyCustomerSessionCookie(sessionCookie);

    if (!decodedSession) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      email: decodedSession.email || null,
      uid: decodedSession.uid,
    });
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al validar la sesion cliente");
  }
}

export async function POST(request: Request) {
  try {
    ensureCommerceFeatureEnabled("userAccounts", "Las cuentas de usuario no estan habilitadas en modo catalogo.");
    const payload = (await request.json()) as CustomerSessionPayload;
    const idToken = typeof payload.idToken === "string" ? payload.idToken.trim() : "";

    if (!idToken) {
      return NextResponse.json({ error: "Token no proporcionado." }, { status: 400 });
    }

    const decodedToken = await verifyCustomerIdToken(idToken);

    if (!decodedToken) {
      return NextResponse.json({ error: "Token invalido o expirado." }, { status: 401 });
    }

    await ensureCustomerProfile(decodedToken.uid, { email: decodedToken.email ?? null });
    const sessionCookie = await createCustomerSessionCookie(idToken);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, sessionCookie, buildCookieOptions());
    return response;
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al crear la sesion cliente");
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, "", {
    ...buildCookieOptions(),
    maxAge: 0,
  });
  return response;
}
