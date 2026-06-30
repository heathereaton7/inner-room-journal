import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  EmailAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  addDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import {
  getFunctions,
  httpsCallable,
} from "firebase/functions";

// In production, auth must run on the SAME ORIGIN as the app. iOS/iPadOS (all
// WebKit) and other browsers that block third-party storage will silently fail
// the signInWithRedirect / signInWithPopup handoff when authDomain is a
// different origin (the default *.firebaseapp.com). A Vercel rewrite proxies
// /__/auth/* on this domain through to the Firebase backend (see vercel.json),
// so the credential round-trips first-party and the sign-in completes.
// Dev (vite, localhost) keeps the default authDomain.
const PROD_AUTH_DOMAIN = "innerroomjournal.com";
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.PROD ? PROD_AUTH_DOMAIN : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Only initialize if config is present (allows app to work without Firebase)
let auth = null;
let db = null;
let googleProvider = null;
let functions = null;

if (firebaseConfig.apiKey) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  // Always show Google's account chooser so users can pick which account to use
  // instead of being signed in silently with the one already active in Chrome.
  googleProvider.setCustomParameters({ prompt: "select_account" });
  try { functions = getFunctions(app); } catch(e) { console.warn("Firebase Functions not available:", e.message); }
}

export {
  auth,
  db,
  functions,
  googleProvider,
  EmailAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  addDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  httpsCallable,
};
