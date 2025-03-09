import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue, update, remove } from "firebase/database";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDNt19uhUipfFb6_ii-89pn1-6TUdULQOo",
  authDomain: "odoo-dev-cegahtipu.firebaseapp.com",
  projectId: "odoo-dev-cegahtipu",
  storageBucket: "odoo-dev-cegahtipu.firebasestorage.app",
  messagingSenderId: "943933171049",
  appId: "1:943933171049:web:22d705485bdb9f03e9c9f8",
  measurementId: "G-KX77BZEH00",
  databaseURL: "https://odoo-dev-cegahtipu-default-rtdb.asia-southeast1.firebasedatabase.app"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export const registerUser = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);
export const loginUser = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);
export const logoutUser = () => signOut(auth);
export const authStateChanged = (callback: (user: any) => void) =>
  onAuthStateChanged(auth, callback);

export const addNote = (noteData: any) => push(ref(db, "notes/global"), noteData);
export const getNotes = (callback: (notes: any) => void) =>
  onValue(ref(db, "notes/global"), (snapshot) => callback(snapshot.val()));
export const updateNote = (noteId: string, updatedData: any) =>
  update(ref(db, `notes/global/${noteId}`), updatedData);
export const deleteNote = (noteId: string) => remove(ref(db, `notes/global/${noteId}`));

export default db;