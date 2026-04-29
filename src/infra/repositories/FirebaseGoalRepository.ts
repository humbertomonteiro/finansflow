import { IRepository } from "@/domain/interfaces/repository/repository";
import { Goal } from "@/domain/entities/goal/Goal";
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

export class GoalRepositoryFirestore implements IRepository<Goal> {
  private collection = "goals";

  async save(goal: Goal): Promise<Goal> {
    const docRef = doc(db, this.collection, goal.id);
    await setDoc(docRef, goal.toJSON());
    return goal;
  }

  async findAll(): Promise<Goal[]> {
    const snapshot = await getDocs(collection(db, this.collection));
    return snapshot.docs.map((d) => Goal.fromData(d.data() as any));
  }

  async findById(id: string): Promise<Goal | null> {
    const docRef = doc(db, this.collection, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return Goal.fromData(docSnap.data() as any);
  }

  async update(id: string, goal: Partial<Goal>): Promise<Goal> {
    const docRef = doc(db, this.collection, id);
    const data = goal.toJSON ? goal.toJSON() : goal;
    await setDoc(docRef, data, { merge: true });
    const updated = await this.findById(id);
    if (!updated) throw new Error("Goal not found after update");
    return updated;
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collection, id);
    await deleteDoc(docRef);
  }

  async findByUserId(userId: string): Promise<Goal[]> {
    const q = query(
      collection(db, this.collection),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => Goal.fromData(d.data() as any));
  }
}
