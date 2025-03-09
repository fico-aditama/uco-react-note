import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue, update, remove } from "firebase/database";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

// Ganti dengan konfigurasi Firebase Anda
const firebaseConfig = {
  apiKey: "AIzaSyDNt19uhUipfFb6_ii-89pn1-6TUdULQOo",
  authDomain: "odoo-dev-cegahtipu.firebaseapp.com",
  projectId: "odoo-dev-cegahtipu",
  storageBucket: "odoo-dev-cegahtipu.firebasestorage.app",
  messagingSenderId: "943933171049",
  appId: "1:943933171049:web:22d705485bdb9f03e9c9f8",
  measurementId: "G-KX77BZEH00"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Fungsi Autentikasi
export const registerUser = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);
export const loginUser = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);
export const logoutUser = () => signOut(auth);
export const authStateChanged = (callback: (user: any) => void) =>
  onAuthStateChanged(auth, callback);

// Fungsi CRUD
export const addNote = (noteData: any, uid: string) => push(ref(db, `notes/${uid}`), noteData);
export const getNotes = (uid: string, callback: (notes: any) => void) =>
  onValue(ref(db, `notes/${uid}`), (snapshot) => callback(snapshot.val()));
export const updateNote = (uid: string, noteId: string, updatedData: any) =>
  update(ref(db, `notes/${uid}/${noteId}`), updatedData);
export const deleteNote = (uid: string, noteId: string) =>
  remove(ref(db, `notes/${uid}/${noteId}`));

export default db;