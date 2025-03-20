import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import { getDatabase, ref, push, onValue, update, remove } from "firebase/database";

export interface Note {
  id: string;
  title: string;
  content: string;
  author: string;
  timestamp: string;
  uid: string;
  status: "todo" | "inprogress" | "done";
}

// Replace with your actual Firebase config
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
const db = getDatabase(app);

// Set persistence to keep user logged in
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("Persistence set to local"))
  .catch((error) => console.error("Persistence error:", error));

export const loginUser = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const logoutUser = () => signOut(auth);

export const authStateChanged = (callback: (user: import("firebase/auth").User | null) => void) =>
  onAuthStateChanged(auth, callback);

export const registerUser = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const sendVerificationEmail = (user: import("firebase/auth").User) => {
  const actionCodeSettings = {
    url: "http://localhost:3000/", // Redirect to login page after verification
    handleCodeInApp: true,
  };
  return sendEmailVerification(user, actionCodeSettings);
};

export const addNote = (note: Omit<Note, "id">) => {
  console.log("Adding note:", note);
  console.log("Current User:", auth.currentUser);
  const notesRef = ref(db, "notes");
  return push(notesRef, note); // Push creates a unique ID
};

export const getNotes = (callback: (notes: Record<string, Note>) => void) => {
  const notesRef = ref(db, "notes");
  return onValue(notesRef, (snapshot) => {
    const data = snapshot.val();
    const notesData: Record<string, Note> = {};
    if (data) {
      Object.entries(data).forEach(([id, note]: [string, any]) => {
        notesData[id] = { id, ...note } as Note;
      });
    }
    callback(notesData);
  });
};

export const updateNote = (id: string, note: Partial<Note>) => {
  const noteRef = ref(db, `notes/${id}`);
  return update(noteRef, note);
};

export const deleteNote = (id: string) => {
  const noteRef = ref(db, `notes/${id}`);
  return remove(noteRef);
};