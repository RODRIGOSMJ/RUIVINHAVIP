import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  doc,
  getDocFromServer,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import defaultAppletConfig from '../firebase-applet-config.json';

export interface FirebaseConfigValues {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

const FIREBASE_OVERRIDE_KEY = 'ruivinha_vip_firebase_override';

function loadCustomFirebaseConfig(): Partial<FirebaseConfigValues> | null {
  try {
    const raw = localStorage.getItem(FIREBASE_OVERRIDE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FirebaseConfigValues>;
    if (parsed.apiKey && parsed.projectId && parsed.appId) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * =========================================================================
 * CONFIGURAÇÃO DO FIREBASE (Substitua aqui ou pelo Painel Admin se desejar)
 * =========================================================================
 */
const customConfig = loadCustomFirebaseConfig();

export const firebaseConfig: FirebaseConfigValues = {
  apiKey: customConfig?.apiKey || defaultAppletConfig.apiKey,
  authDomain: customConfig?.authDomain || defaultAppletConfig.authDomain,
  projectId: customConfig?.projectId || defaultAppletConfig.projectId,
  storageBucket: customConfig?.storageBucket || defaultAppletConfig.storageBucket,
  messagingSenderId: customConfig?.messagingSenderId || defaultAppletConfig.messagingSenderId,
  appId: customConfig?.appId || defaultAppletConfig.appId,
  firestoreDatabaseId:
    customConfig?.firestoreDatabaseId !== undefined
      ? customConfig.firestoreDatabaseId
      : defaultAppletConfig.firestoreDatabaseId,
};

export function saveCustomFirebaseConfig(nextConfig: FirebaseConfigValues): void {
  localStorage.setItem(FIREBASE_OVERRIDE_KEY, JSON.stringify(nextConfig));
}

export function clearCustomFirebaseConfig(): void {
  localStorage.removeItem(FIREBASE_OVERRIDE_KEY);
}

export const app: FirebaseApp =
  getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();
