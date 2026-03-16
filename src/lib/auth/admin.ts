import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { createHttpError } from "@/lib/api/errors";
import { getFirebaseAdminApp } from "@/lib/firebase/admin";

export const ADMIN_SESSION_COOKIE_NAME = "primera_admin_session";
const ADMIN_SESSION_EXPIRES_IN_MS = 1000 * 60 * 60 * 24 * 5;
const VERIFY_REVOKED_ADMIN_SESSION = process.env.NODE_ENV === "production";

function isAdminToken(decodedToken: DecodedIdToken): boolean {
  return decodedToken.admin === true || decodedToken.role === "admin";
}

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

export async function verifyAdminIdToken(token: string): Promise<DecodedIdToken | null> {
  try {
    const decodedToken = await getAuth(getFirebaseAdminApp()).verifyIdToken(token);
    return isAdminToken(decodedToken) ? decodedToken : null;
  } catch {
    return null;
  }
}

export async function createAdminSessionCookie(idToken: string): Promise<string> {
  const decodedToken = await verifyAdminIdToken(idToken);

  if (!decodedToken) {
    throw createHttpError(403, "No autorizado.");
  }

  return getAuth(getFirebaseAdminApp()).createSessionCookie(idToken, {
    expiresIn: ADMIN_SESSION_EXPIRES_IN_MS,
  });
}

export async function verifyAdminSessionCookie(
  sessionCookie: string | null
): Promise<DecodedIdToken | null> {
  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedToken = await getAuth(getFirebaseAdminApp()).verifySessionCookie(
      sessionCookie,
      VERIFY_REVOKED_ADMIN_SESSION
    );
    return isAdminToken(decodedToken) ? decodedToken : null;
  } catch {
    return null;
  }
}

export async function requireAdmin(request: Request): Promise<DecodedIdToken> {
  const token = readBearerToken(request);
  const sessionCookie = readCookieValue(request, ADMIN_SESSION_COOKIE_NAME);

  if (token) {
    const decodedToken = await verifyAdminIdToken(token);

    if (!decodedToken) {
      throw createHttpError(401, "Token invalido o expirado.");
    }

    return decodedToken;
  }

  const decodedSession = await verifyAdminSessionCookie(sessionCookie);

  if (!decodedSession) {
    throw createHttpError(401, "Token no proporcionado.");
  }

  return decodedSession;
}
