import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/api/errors";
import { ensureCommerceFeatureEnabled } from "@/lib/commerce-mode";
import { registerCustomerProfile } from "@/lib/customer/service";
import {
  createCustomerSessionCookie,
  CUSTOMER_SESSION_COOKIE_NAME,
  verifyCustomerIdToken,
} from "@/lib/auth/customer";

interface CustomerRegisterPayload {
  idToken?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  phone?: unknown;
  dni?: unknown;
}

const CUSTOMER_COOKIE_MAX_AGE = 60 * 60 * 24 * 5;

function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CUSTOMER_COOKIE_MAX_AGE,
  };
}

export async function POST(request: Request) {
  try {
    ensureCommerceFeatureEnabled("userAccounts", "Las cuentas de usuario no estan habilitadas en modo catalogo.");
    const payload = (await request.json()) as CustomerRegisterPayload;
    const idToken = typeof payload.idToken === "string" ? payload.idToken.trim() : "";

    if (!idToken) {
      return NextResponse.json({ error: "Token no proporcionado." }, { status: 400 });
    }

    const decodedToken = await verifyCustomerIdToken(idToken);

    if (!decodedToken) {
      return NextResponse.json({ error: "Token invalido o expirado." }, { status: 401 });
    }

    const customer = await registerCustomerProfile(decodedToken.uid, {
      email: decodedToken.email ?? null,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone,
      dni: payload.dni,
    });
    const sessionCookie = await createCustomerSessionCookie(idToken);
    const response = NextResponse.json(customer, { status: 201 });
    response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, sessionCookie, buildCookieOptions());
    return response;
  } catch (error: unknown) {
    return toErrorResponse(error, "Error al registrar el cliente");
  }
}
