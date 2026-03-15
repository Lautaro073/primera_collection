import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE_NAME,
  verifyAdminSessionCookie,
} from "@/lib/auth/admin";

export async function readAdminPageSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value || null;
  return verifyAdminSessionCookie(sessionCookie);
}
