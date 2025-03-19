import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
} from "firebase/auth";
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "xxxxx",
  authDomain: "xxxxx",
  projectId: "xxxxx",
  storageBucket: "xxxxx",
  messagingSenderId: "xxxxx",
  appId: "xxxxx",
  measurementId: "xxxxx",
  databaseURL: "xxxxx"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const loginUser = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const logoutUser = () => signOut(auth);
export const authStateChanged = (callback) => onAuthStateChanged(auth, callback);
export const registerUser = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const sendVerificationEmail = (user) => sendEmailVerification(user);

export const addNote = (note) => addDoc(collection(db, "notes"), note);
export const getNotes = (callback) => {
  return onSnapshot(collection(db, "notes"), (snapshot) => {
    const notesData = {};
    snapshot.forEach((doc) => (notesData[doc.id] = doc.data()));
    callback(notesData);
  });
};
export const updateNote = (id, note) => updateDoc(doc(db, "notes", id), note);
export const deleteNote = (id) => deleteDoc(doc(db, "notes", id));