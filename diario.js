import { 
  db, collection, addDoc, query, 
  where, getDocs, deleteDoc, doc, 
  onSnapshot 
} from "./firebase.js";

export class ClassDiary {
  static async addEntry(entryData) {
    const docRef = await addDoc(collection(db, "entries"), entryData);
    return docRef.id;
  }

  static async getEntries(userId, filters = {}) {
    let q = query(collection(db, "entries"), where("teacherId", "==", userId));
    
    if (filters.class) {
      q = query(q, where("class", "==", filters.class));
    }
    
    if (filters.month) {
      const [year, month] = filters.month.split('-');
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      q = query(
        q,
        where("date", ">=", startDate.toISOString().split('T')[0]),
        where("date", "<=", endDate.toISOString().split('T')[0])
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  static async deleteEntry(entryId) {
    await deleteDoc(doc(db, "entries", entryId));
  }

  static subscribeToEntries(userId, callback) {
    const q = query(collection(db, "entries"), where("teacherId", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(entries);
    });
  }
}
