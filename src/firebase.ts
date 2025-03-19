import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile as updateAuthProfile,
} from "firebase/auth";
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";

export interface Note {
  id: string;
  title: string;
  content: string;
  author: string;
  timestamp: string;
  uid: string;
  status: "todo" | "inprogress" | "done";
  category?: string;
  pinned?: boolean;
}

export interface UserProfile {
  uid: string;
  displayName?: string;
  email: string;
}

const firebaseConfig = {
  apiKey: "AIzaSyDNt19uhUipfFb6_ii-89pn1-6TUdULQOo",
  authDomain: "odoo-dev-cegahtipu.firebaseapp.com",
  databaseURL: "https://odoo-dev-cegahtipu-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "odoo-dev-cegahtipu",
  storageBucket: "odoo-dev-cegahtipu.firebasestorage.app",
  messagingSenderId: "943933171049",
  appId: "1:943933171049:web:22d705485bdb9f03e9c9f8",
  measurementId: "G-KX77BZEH00"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const loginUser = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);
export const logoutUser = () => signOut(auth);
export const authStateChanged = (callback: (user: import("firebase/auth").User | null) => void) =>
  onAuthStateChanged(auth, callback);
export const registerUser = (email: string, password: string) => createUserWithEmailAndPassword(auth, email, password);
export const sendVerificationEmail = (user: import("firebase/auth").User) => sendEmailVerification(user);
export const sendResetPasswordEmail = (email: string) => sendPasswordResetEmail(auth, email);

export const addNote = (note: Omit<Note, "id">) => {
  const cleanedNote = Object.fromEntries(
    Object.entries(note).filter(([, value]) => value !== undefined)
  ) as Omit<Note, "id">;
  return addDoc(collection(db, "notes"), cleanedNote);
};

export const getNotes = (callback: (notes: Record<string, Note>) => void) => {
  return onSnapshot(collection(db, "notes"), (snapshot) => {
    const notesData: Record<string, Note> = {};
    snapshot.forEach((doc) => {
      notesData[doc.id] = { id: doc.id, ...doc.data() } as Note;
    });
    callback(notesData);
  });
};

export const updateNote = (id: string, note: Partial<Note>) => {
  const cleanedNote = Object.fromEntries(
    Object.entries(note).filter(([, value]) => value !== undefined)
  ) as Partial<Note>;
  return updateDoc(doc(db, "notes", id), cleanedNote);
};

export const deleteNote = (id: string) => deleteDoc(doc(db, "notes", id));

// Profile Functions
export const setUserProfile = (uid: string, profile: UserProfile) => setDoc(doc(db, "users", uid), profile);
export const getUserProfile = (uid: string) => getDoc(doc(db, "users", uid)).then((doc) => doc.data() as UserProfile);
export const updateUserProfile = (uid: string, profile: Partial<UserProfile>) =>
  updateDoc(doc(db, "users", uid), profile);
export const updateAuthDisplayName = (user: import("firebase/auth").User, displayName: string) =>
  updateAuthProfile(user, { displayName });