import { 
  db, collection, addDoc, query, 
  where, orderBy, onSnapshot, 
  deleteDoc, doc, serverTimestamp 
} from "./firebase.js";

export class ClassDiary {
  static async addEntry(userId, content, subject, date) {
    try {
      const docRef = await addDoc(collection(db, "entries"), {
        userId,
        content,
        subject,
        date, // Formato: "YYYY-MM-DD"
        createdAt: serverTimestamp() // Adiciona automaticamente o timestamp
      });
      return docRef.id;
    } catch (error) {
      console.error("Erro ao adicionar anotação:", error);
      throw error;
    }
  }

  static async getEntries(userId, filters = {}) {
    try {
      let q = query(
        collection(db, "entries"),
        where("userId", "==", userId)
      );

      // Filtro por matéria (subject)
      if (filters.subject) {
        q = query(q, where("subject", "==", filters.subject));
      }

      // Filtro por data (date)
      if (filters.date) {
        q = query(q, where("date", "==", filters.date));
      }

      // Ordenação padrão por data de criação (mais recentes primeiro)
      q = query(q, orderBy("createdAt", "desc"));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        // Convertendo timestamp para formato legível
        createdAt: doc.data().createdAt?.toDate() || null
      }));
    } catch (error) {
      console.error("Erro ao buscar anotações:", error);
      throw error;
    }
  }

  static async deleteEntry(entryId) {
    try {
      await deleteDoc(doc(db, "entries", entryId));
      console.log("Anotação deletada com sucesso");
    } catch (error) {
      console.error("Erro ao deletar anotação:", error);
      throw error;
    }
  }

  static subscribeToEntries(userId, callback, filters = {}) {
    try {
      let q = query(
        collection(db, "entries"),
        where("userId", "==", userId)
      );

      // Aplicando filtros se existirem
      if (filters.subject) {
        q = query(q, where("subject", "==", filters.subject));
      }
      if (filters.date) {
        q = query(q, where("date", "==", filters.date));
      }

      // Ordenação
      q = query(q, orderBy("createdAt", "desc"));

      return onSnapshot(q, (snapshot) => {
        const entries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || null
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
