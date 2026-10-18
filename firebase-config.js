/**
 * ==========================================================================
 * CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE (v10+ CDN)
 * Dra. Odalys Martínez - Agenda Profesional & Gestión Médica
 * ==========================================================================
 */

// Importación de módulos oficiales de Firebase vía CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// --------------------------------------------------------------------------
// 1. CREDENCIALES DEL PROYECTO FIREBASE
// Reemplaza las credenciales a continuación con las de tu consola de Firebase
// --------------------------------------------------------------------------
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD4JEqEYyNxcIUz3XwfM8GMN7Idn2LD6-U",
  authDomain: "citas-odalys.firebaseapp.com",
  projectId: "citas-odalys",
  storageBucket: "citas-odalys.firebasestorage.app",
  messagingSenderId: "724248941510",
  appId: "1:724248941510:web:078c79f8a078c52eaad8c7",
  measurementId: "G-GC0WK18QNF",
};

// --------------------------------------------------------------------------
// 2. INICIALIZACIÓN DE SERVICIOS
// --------------------------------------------------------------------------
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Exportar instancias y funciones útiles globalmente para uso en script.js
window.FirebaseDB = {
  db,
  auth,
  // Métodos de Autenticación
  login: (email, password) => signInWithEmailAndPassword(auth, email, password),
  logout: () => signOut(auth),
  onAuth: (callback) => onAuthStateChanged(auth, callback),

  // Colecciones de Firestore
  patientsRef: collection(db, "pacientes"),
  eventsRef: collection(db, "eventos"),

  // Funciones Firestore
  addPatient: (data) => addDoc(collection(db, "pacientes"), data),
  updatePatient: (id, data) => updateDoc(doc(db, "pacientes", id), data),
  deletePatient: (id) => deleteDoc(doc(db, "pacientes", id)),
  subscribePatients: (callback) =>
    onSnapshot(collection(db, "pacientes"), callback),

  addEvent: (data) => addDoc(collection(db, "eventos"), data),
  deleteEvent: (id) => deleteDoc(doc(db, "eventos", id)),
  subscribeEvents: (callback) =>
    onSnapshot(collection(db, "eventos"), callback),
};
