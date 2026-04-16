import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCpcTAo0hLwzssyE_vz-0f2LBYyjt0Q9-0",
  authDomain: "quiz-matematica-ad04e.firebaseapp.com",
  projectId: "quiz-matematica-ad04e",
  storageBucket: "quiz-matematica-ad04e.firebasestorage.app",
  messagingSenderId: "865257775335",
  appId: "1:865257775335:web:deca1b45c0a777ffb0c242",
  measurementId: "G-0FWEBWKS1F"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);