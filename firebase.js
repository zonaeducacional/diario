import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { 
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";
import { 
    getFirestore,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDCrKS17Fle4ycDbvD8lIFjndq1XVeDjEk",
    authDomain: "diario-243fa.firebaseapp.com",
    projectId: "diario-243fa",
    storageBucket: "diario-243fa.appspot.com",
    messagingSenderId: "836464209379",
    appId: "1:836464209379:web:c3e0484ad00636c18184d6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { 
    auth, 
    db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    deleteDoc,
    doc,
    onSnapshot
};
