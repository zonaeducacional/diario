import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, 
  query, where, getDocs, deleteDoc, doc,
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js";
import { 
  getAuth, createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDCrKS17Fle4ycDbvD8lIFjndq1XVeDjEk", // SUA_API_KEY
  authDomain: "diario-243fa.firebaseapp.com", // SEU_AUTH_DOMAIN
  projectId: "diario-243fa", // SEU_PROJECT_ID
  storageBucket: "diario-243fa.appspot.com", // SEU_STORAGE_BUCKET
  messagingSenderId: "836464209379", // SEU_SENDER_ID
  appId: "1:836464209379:web:c3e0484ad00636c18184d6" // SEU_APP_ID
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, collection, addDoc, query, where, getDocs, deleteDoc, doc, 
         createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, 
         onAuthStateChanged, onSnapshot };
