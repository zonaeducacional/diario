import { 
  auth, createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, signOut, 
  onAuthStateChanged 
} from "./firebase.js";

export class AuthManager {
  static async register(email, password, name) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    return userCredential.user;
  }

  static async login(email, password) {
    return await signInWithEmailAndPassword(auth, email, password);
  }

  static async logout() {
    await signOut(auth);
  }

  static onAuthChange(callback) {
    onAuthStateChanged(auth, user => callback(user));
  }
}
