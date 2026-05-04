import { cookies } from "next/headers";
import {
  CUSTOMER_SESSION_COOKIE_NAME,
  verifyCustomerSessionCookie,
} from "@/lib/auth/customer";

export async function readCustomerPageSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(CUSTOMER_SESSION_COOKIE_NAME)?.value || null;
  return verifyCustomerSessionCookie(sessionCookie);
}
