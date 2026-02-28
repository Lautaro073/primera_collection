import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

type ProcessWithLoadEnvFile = NodeJS.Process & {
  loadEnvFile?: (path: string) => void;
};

const processWithLoadEnvFile = process as ProcessWithLoadEnvFile;

if (typeof processWithLoadEnvFile.loadEnvFile === "function") {
  processWithLoadEnvFile.loadEnvFile(".env.local");
}

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta la variable ${name}.`);
  }

  return value;
}

function readArg(name: string): string {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length).trim() : "";
}

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert({
      projectId: required("FIREBASE_PROJECT_ID"),
      clientEmail: required("FIREBASE_CLIENT_EMAIL"),
      privateKey: required("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
  });
}

async function main(): Promise<void> {
  const uid = readArg("uid");
  const email = readArg("email");

  if (!uid && !email) {
    throw new Error("Usa --uid=<uid> o --email=<email>.");
  }

  const auth = getAuth(getAdminApp());
  const userRecord = uid
    ? await auth.getUser(uid)
    : await auth.getUserByEmail(email);

  const existingClaims = userRecord.customClaims || {};

  await auth.setCustomUserClaims(userRecord.uid, {
    ...existingClaims,
    admin: true,
    role: "admin",
  });

  console.log(`Claim admin asignado a ${userRecord.email || userRecord.uid}`);
  console.log("El usuario debe cerrar sesion y volver a entrar para refrescar el token.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Error desconocido.";
  console.error(message);
  process.exit(1);
});
