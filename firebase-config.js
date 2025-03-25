// Configuração do Firebase (compatible API)
const firebaseConfig = {
  apiKey: "AIzaSyDCrKS17Fle4ycDbvD8lIFjndq1XVeDjEk",
  authDomain: "diario-243fa.firebaseapp.com",
  projectId: "diario-243fa",
  storageBucket: "diario-243fa.appspot.com",
  messagingSenderId: "836464209379",
  appId: "1:836464209379:web:c3e0484ad00636c18184d6"
};

// Inicialização
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
