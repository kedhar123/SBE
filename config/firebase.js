const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env variable:", err);
  }
}

if (!serviceAccount) {
  const serviceAccountPath = path.join(__dirname, "..", "key.json");
  if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  } else {
    console.warn("Firebase service account credentials file (key.json) not found!");
  }
}

if (serviceAccount) {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
} else {
  console.error("Firebase admin failed to initialize: No credentials provided.");
  console.error("Set FIREBASE_SERVICE_ACCOUNT env variable or provide key.json");
}

const db = admin.apps.length ? admin.firestore() : null;

module.exports = db;
