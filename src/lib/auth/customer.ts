import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { createHttpError } from "@/lib/api/errors";
import { getFirebaseAdminApp } from "@/lib/firebase/admin";

export const CUSTOMER_SESSION_COOKIE_NAME = "primera_customer_session";
const CUSTOMER_SESSION_EXPIRES_IN_MS = 1000 * 60 * 60 * 24 * 5;
const VERIFY_REVOKED_CUSTOMER_SESSION = process.env.NODE_ENV === "production";

function readBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization") || "";

  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice(7).trim() || null;
}

function readCookieValue(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie") || "";

  for (const segment of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = segment.trim().split("=");

    if (rawName === name) {
      const value = rawValue.join("=").trim();
      return value ? decodeURIComponent(value) : null;
    }
  }

  return null;
}

export async function verifyCustomerIdToken(token: string): Promise<DecodedIdToken | null> {
  try {
    return await getAuth(getFirebaseAdminApp()).verifyIdToken(token);
  } catch {
    return null;
  }
}

export async function createCustomerSessionCookie(idToken: string): Promise<string> {
  const decodedToken = await verifyCustomerIdToken(idToken);

  if (!decodedToken) {
    throw createHttpError(401, "Token invalido o expirado.");
  }

  return getAuth(getFirebaseAdminApp()).createSessionCookie(idToken, {
    expiresIn: CUSTOMER_SESSION_EXPIRES_IN_MS,
  });
}

export async function verifyCustomerSessionCookie(
  sessionCookie: string | null
): Promise<DecodedIdToken | null> {
  if (!sessionCookie) {
    return null;
  }

  try {
    return await getAuth(getFirebaseAdminApp()).verifySessionCookie(
      sessionCookie,
      VERIFY_REVOKED_CUSTOMER_SESSION
    );
  } catch {
    return null;
  }
}

export async function requireCustomer(request: Request): Promise<DecodedIdToken> {
  const token = readBearerToken(request);
  const sessionCookie = readCookieValue(request, CUSTOMER_SESSION_COOKIE_NAME);

  if (token) {
    const decodedToken = await verifyCustomerIdToken(token);

    if (!decodedToken) {
      throw createHttpError(401, "Token invalido o expirado.");
    }

    return decodedToken;
  }

  const decodedSession = await verifyCustomerSessionCookie(sessionCookie);

  if (!decodedSession) {
    throw createHttpError(401, "Token no proporcionado.");
  }

  return decodedSession;
}

export async function getOptionalCustomer(request: Request): Promise<DecodedIdToken | null> {
  const token = readBearerToken(request);
  const sessionCookie = readCookieValue(request, CUSTOMER_SESSION_COOKIE_NAME);

  if (token) {
    return verifyCustomerIdToken(token);
  }

  return verifyCustomerSessionCookie(sessionCookie);
}
