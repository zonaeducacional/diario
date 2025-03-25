import { 
  db, collection, addDoc, query, 
  where, orderBy, onSnapshot, 
  deleteDoc, doc, serverTimestamp 
} from "./firebase.js";

export class ClassDiary {
  static async addEntry(userId, content) {
    try {
      const docRef = await addDoc(collection(db, "entries"), {
        userId,
        content,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Erro ao adicionar anotação:", error);
      throw error;
    }
  }

  static async getEntries(userId) {
    try {
      const q = query(
        collection(db, "entries"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
    } catch (error) {
      console.error("Erro ao buscar anotações:", error);
      throw error;
    }
  }

  static async deleteEntry(entryId) {
    try {
      await deleteDoc(doc(db, "entries", entryId));
    } catch (error) {
      console.error("Erro ao deletar anotação:", error);
      throw error;
    }
  }

  static subscribeToEntries(userId, callback) {
    try {
      const q = query(
        collection(db, "entries"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      
      return onSnapshot(q, (snapshot) => {
        const entries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convertendo timestamp para data legível
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        callback(entries);
      }, (error) => {
        console.error("Erro no listener:", error);
      });
    } catch (error) {
      console.error("Erro ao configurar listener:", error);
      throw error;
    }
  }
}
