"use client";

import { type Auth, type IdTokenResult, type User, signOut } from "firebase/auth";
import type { AdminClaims, AdminSession } from "@/types/domain";

interface AdminSessionOptions {
  forceRefresh?: boolean;
}

function isAdminClaims(claims: IdTokenResult["claims"]): claims is IdTokenResult["claims"] & AdminClaims {
  return claims.admin === true || claims.role === "admin";
}

export async function getAdminSession(
  auth: Auth,
  user: User | null = auth.currentUser,
  { forceRefresh = false }: AdminSessionOptions = {}
): Promise<AdminSession | null> {
  if (!user) {
    return null;
  }

  const tokenResult = await user.getIdTokenResult(forceRefresh);

  if (!isAdminClaims(tokenResult.claims)) {
    return null;
  }

  return {
    user,
    token: tokenResult.token,
    claims: tokenResult.claims,
  };
}

export async function requireAdminSession(
  auth: Auth,
  user: User | null = auth.currentUser,
  options: AdminSessionOptions = {}
): Promise<AdminSession> {
  const session = await getAdminSession(auth, user, options);

  if (!session) {
    if (auth.currentUser) {
      await signOut(auth);
    }

    throw new Error("Tu usuario no tiene permisos de administrador.");
  }

  return session;
}

export async function persistAdminSession(user: User): Promise<void> {
  const idToken = await user.getIdToken();
  const response = await fetch("/api/admin/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    throw new Error("No se pudo guardar la sesion admin.");
  }
}

export async function clearAdminSession(): Promise<void> {
  await fetch("/api/admin/session", {
    method: "DELETE",
    credentials: "same-origin",
  });
}

export async function authorizedFetch(
  auth: Auth,
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const session = await requireAdminSession(auth);

  async function performRequest(token: string): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);

    return fetch(input, {
      ...init,
      credentials: init.credentials ?? "same-origin",
      headers,
    });
  }

  let response = await performRequest(session.token);

  if (response.status !== 401) {
    return response;
  }

  const refreshedSession = await requireAdminSession(auth, auth.currentUser, {
    forceRefresh: true,
  });
  response = await performRequest(refreshedSession.token);
  return response;
}
