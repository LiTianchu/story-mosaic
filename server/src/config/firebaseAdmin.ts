import admin from "firebase-admin";
import type { ServiceAccount } from "firebase-admin/app";
import { Bucket } from "@google-cloud/storage";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type ServiceAccountJson = ServiceAccount & {
  project_id?: string;
  storageBucket?: string;
};

const loadServiceAccount = (): ServiceAccountJson => {
  const jsonFromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonFromEnv) {
    try {
      return JSON.parse(jsonFromEnv) as ServiceAccountJson;
    } catch {
      throw new Error(
        "Invalid FIREBASE_SERVICE_ACCOUNT_JSON. Provide valid JSON for a Firebase service account.",
      );
    }
  }

  const pathFromEnv =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS;

  const candidatePaths = [
    pathFromEnv,
    // Backwards-compatible local dev default (not committed).
    path.resolve(__dirname, "../../serviceAccountKey.json"),
  ].filter(Boolean) as string[];

  for (const candidatePath of candidatePaths) {
    if (fs.existsSync(candidatePath)) {
      const raw = fs.readFileSync(candidatePath, "utf-8");
      return JSON.parse(raw) as ServiceAccountJson;
    }
  }

  throw new Error(
    "Firebase Admin credentials not found. Set FIREBASE_SERVICE_ACCOUNT_PATH/GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON (see server/.env.example).",
  );
};

const serviceAccount = loadServiceAccount();

const bucketFromEnv =
  process.env.FIREBASE_STORAGE_BUCKET || process.env.GCLOUD_STORAGE_BUCKET;

const bucketFromServiceAccount =
  // Prefer an explicit storageBucket property if present.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (serviceAccount as any).storageBucket ||
  (serviceAccount.project_id
    ? `${serviceAccount.project_id}.firebasestorage.app`
    : undefined) ||
  (serviceAccount.project_id ? `${serviceAccount.project_id}.appspot.com` : undefined);

const configuredBucket = bucketFromEnv || bucketFromServiceAccount;

if (!configuredBucket) {
  throw new Error(
    'Unable to resolve Firebase Storage bucket. Set FIREBASE_STORAGE_BUCKET/GCLOUD_STORAGE_BUCKET or ensure serviceAccountKey.json includes project_id.'
  );
}



if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as ServiceAccount),
    storageBucket: configuredBucket,
  });
}

// @ts-ignore - This is a workaround for a type conflict between different module resolutions
// for the @google-cloud/storage package, which is a dependency of firebase-admin.
const bucket: Bucket = admin.storage().bucket();

// Minimal startup log (avoid dumping project identifiers in public logs)
console.log("Firebase Admin initialized");

export { admin, bucket };
