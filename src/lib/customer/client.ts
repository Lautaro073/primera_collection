"use client";

import { type User } from "firebase/auth";

interface PersistCustomerSessionOptions {
  endpoint?: string;
}

interface CustomerRegistrationPayload {
  dni?: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export async function persistCustomerSession(
  user: User,
  { endpoint = "/api/auth/customer-session" }: PersistCustomerSessionOptions = {}
): Promise<void> {
  const idToken = await user.getIdToken();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || "No se pudo guardar la sesion del cliente.");
  }
}

export async function clearCustomerSession(): Promise<void> {
  await fetch("/api/auth/customer-session", {
    method: "DELETE",
    credentials: "same-origin",
  });
}

export async function registerCustomerAccount(
  user: User,
  payload: CustomerRegistrationPayload
): Promise<void> {
  const idToken = await user.getIdToken();
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      idToken,
      ...payload,
    }),
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorPayload?.error || "No se pudo registrar el cliente.");
  }
}
