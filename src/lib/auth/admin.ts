import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { createHttpError } from "@/lib/api/errors";
import { getFirebaseAdminApp } from "@/lib/firebase/admin";

function readBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization") || "";

  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice(7).trim() || null;
}

export async function requireAdmin(request: Request): Promise<DecodedIdToken> {
  const token = readBearerToken(request);

  if (!token) {
    throw createHttpError(401, "Token no proporcionado.");
  }

  let decodedToken: DecodedIdToken;

  try {
    decodedToken = await getAuth(getFirebaseAdminApp()).verifyIdToken(token);
  } catch {
    throw createHttpError(401, "Token invalido o expirado.");
  }

  const isAdmin =
    decodedToken.admin === true || decodedToken.role === "admin";

  if (!isAdmin) {
    throw createHttpError(403, "No autorizado.");
  }

  return decodedToken;
}
