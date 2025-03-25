import { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "./firebase.js";

export class AuthManager {
  static async register(email, password, name) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error("Erro no registro:", error.code, error.message);
      return { success: false, error: error.message };
    }
  }

  static async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error("Erro no login:", error.code, error.message);
      
      // Mensagens amigáveis para erros comuns
      let errorMessage = "Erro ao fazer login";
      switch (error.code) {
        case "auth/invalid-login-credentials":
          errorMessage = "E-mail ou senha incorretos";
          break;
        case "auth/user-not-found":
          errorMessage = "Usuário não encontrado";
          break;
        case "auth/wrong-password":
          errorMessage = "Senha incorreta";
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  }

  static async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error("Erro no logout:", error);
      return { success: false, error: error.message };
    }
  }

  static onAuthChange(callback) {
    return onAuthStateChanged(auth, (user) => {
      console.log("Estado de autenticação alterado:", user);
      callback(user);
    });
  }
}
