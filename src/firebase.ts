import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  User,
  UserCredential,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  DocumentData,
} from "firebase/firestore";

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

export interface Note {
  title: string;
  content: string;
  author: string;
  timestamp: string;
  uid: string;
  status: "todo" | "inprogress" | "done";
}

export const loginUser = (email: string, password: string): Promise<UserCredential> =>
  signInWithEmailAndPassword(auth, email, password);

export const logoutUser = (): Promise<void> => signOut(auth);

export const authStateChanged = (callback: (user: User | null) => void): (() => void) =>
  onAuthStateChanged(auth, callback);

export const registerUser = (email: string, password: string): Promise<UserCredential> =>
  createUserWithEmailAndPassword(auth, email, password);

export const sendVerificationEmail = (user: User): Promise<void> => sendEmailVerification(user);

export const addNote = (note: Note): Promise<DocumentData> => addDoc(collection(db, "notes"), note);

export const getNotes = (callback: (notes: Record<string, Note>) => void): (() => void) => {
  return onSnapshot(collection(db, "notes"), (snapshot) => {
    const notesData: Record<string, Note> = {};
    snapshot.forEach((doc) => (notesData[doc.id] = doc.data() as Note));
    callback(notesData);
  });
};

export const updateNote = (id: string, note: Partial<Note>): Promise<void> =>
  updateDoc(doc(db, "notes", id), note);

export const deleteNote = (id: string): Promise<void> => deleteDoc(doc(db, "notes", id));