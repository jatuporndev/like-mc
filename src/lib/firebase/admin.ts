import "server-only";

import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Server-only Firebase Admin singleton.
 *
 * Initialization is LAZY: the credential is only read the first time `adminAuth`
 * or `adminDb` is actually used at request time. This matters because Next.js
 * imports route modules during the build's "collect page data" phase, where the
 * service-account env vars may be absent — eager init would crash the build.
 */
function createAdminApp(): App {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, " +
        "FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

let appInstance: App | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

function adminApp(): App {
  return (appInstance ??= getApps().length ? getApp() : createAdminApp());
}

function getAdminAuth(): Auth {
  return (authInstance ??= getAuth(adminApp()));
}

function getAdminDb(): Firestore {
  return (dbInstance ??= getFirestore(adminApp()));
}

/** Lazily-bound proxy: defers SDK init until a property/method is accessed. */
function lazyProxy<T extends object>(resolve: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop, receiver) {
      const instance = resolve();
      const value = Reflect.get(instance as object, prop, receiver);
      return typeof value === "function" ? value.bind(instance) : value;
    },
  });
}

export const adminAuth: Auth = lazyProxy(getAdminAuth);
export const adminDb: Firestore = lazyProxy(getAdminDb);
