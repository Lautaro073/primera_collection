"use client";

import { type Auth, type IdTokenResult, type User, signOut } from "firebase/auth";
import type { AdminClaims, AdminSession } from "@/types/domain";

function isAdminClaims(claims: IdTokenResult["claims"]): claims is IdTokenResult["claims"] & AdminClaims {
  return claims.admin === true || claims.role === "admin";
}

export async function getAdminSession(auth: Auth, user: User | null = auth.currentUser): Promise<AdminSession | null> {
  if (!user) {
    return null;
  }

  const tokenResult = await user.getIdTokenResult(true);

  if (!isAdminClaims(tokenResult.claims)) {
    return null;
  }

  return {
    user,
    token: tokenResult.token,
    claims: tokenResult.claims,
  };
}

export async function requireAdminSession(auth: Auth, user: User | null = auth.currentUser): Promise<AdminSession> {
  const session = await getAdminSession(auth, user);

  if (!session) {
    if (auth.currentUser) {
      await signOut(auth);
    }

    throw new Error("Tu usuario no tiene permisos de administrador.");
  }

  return session;
}

export async function authorizedFetch(
  auth: Auth,
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const session = await requireAdminSession(auth);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${session.token}`);

  return fetch(input, {
    ...init,
    headers,
  });
}
