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
    return snapshot.docs.map((d) => Category.fromData(d.data() as any));
  }

  async findById(id: string): Promise<Category | null> {
    const docRef = doc(db, this.collection, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return Category.fromData(docSnap.data() as any);
  }

  async update(id: string, category: Partial<Category>): Promise<Category> {
    const docRef = doc(db, this.collection, id);
    const data = category.toJSON ? category.toJSON() : category;
    await setDoc(docRef, data, { merge: true });
    const updated = await this.findById(id);
    if (!updated) throw new Error("Category not found after update");
    return updated;
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collection, id);
    await deleteDoc(docRef);
  }

  async findByEmail(email: string): Promise<Category | null> {
    return null; // não aplicável para categorias
  }

  /** Retorna categorias padrão do sistema (campo default == true no Firestore) */
  async findCategoriesDefault(): Promise<Category[]> {
    const q = query(
      collection(db, this.collection),
      where("default", "==", true),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => Category.fromData(d.data() as any));
  }

  async findByUserId(userId: string): Promise<Category[]> {
    const q = query(
      collection(db, this.collection),
      where("userId", "==", userId),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => Category.fromData(d.data() as any));
  }
}
