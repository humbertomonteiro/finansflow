import { IRepository } from "@/domain/interfaces/repository/repository";
import { Category } from "@/domain/entities/category/Category";
import { db } from "../services/firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";

export class CategoryRepositoryFirestore implements IRepository<Category> {
  private collection = "categorys";

  async save(category: Category): Promise<Category> {
    const docRef = doc(db, this.collection, category.id);
    await setDoc(docRef, category.toJSON());

    return category;
  }

  async findAll(): Promise<Category[]> {
    const snapshot = await getDocs(collection(db, this.collection));
    return snapshot.docs.map((doc) => doc.data() as Category);
  }

  async findById(id: string): Promise<Category | null> {
    const docRef = doc(db, this.collection, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Category) : null;
  }

  async update(id: string, category: Partial<Category>): Promise<Category> {
    const docRef = doc(db, this.collection, id);
    await setDoc(docRef, category, { merge: true });
    const updatedDoc = await this.findById(id);
    if (!updatedDoc) throw new Error("category not found");
    return updatedDoc;
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collection, id);
    await deleteDoc(docRef);
  }

  async findByEmail(email: string): Promise<Category | null> {
    const q = query(
      collection(db, this.collection),
      where("email", "==", email)
    );
    const snapshot = await getDocs(q);
    const categoryDoc = snapshot.docs[0];
    return categoryDoc ? (categoryDoc.data() as Category) : null;
  }

  async findCategoriesDefault(): Promise<Category[]> {
    const q = query(
      collection(db, this.collection),
      where("default", "==", true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as Category);
  }
}
