import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDjrfGm6E4c4fGT0KI7ms16UTeOUDE3n68",
  authDomain: "simple-todo-app-888.firebaseapp.com",
  projectId: "simple-todo-app-888",
  storageBucket: "simple-todo-app-888.firebasestorage.app",
  messagingSenderId: "716303720452",
  appId: "1:716303720452:web:639e354dd9aedbe57d1551"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
