import { IRepository } from "@/domain/interfaces/repository/repository";
import { User } from "@/domain/entities/user/User";
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

export class UserRepositoryFirestore implements IRepository<User> {
  private collection = "users";

  async save(user: User): Promise<User> {
    const docRef = doc(db, this.collection, user.id);
    await setDoc(docRef, {
      ...user.toJSON(),
      password: user.getPassword(),
    });

    return user;
  }

  async findAll(): Promise<User[]> {
    const snapshot = await getDocs(collection(db, this.collection));
    return snapshot.docs.map((doc) => {
      const data = doc.data() as User & { password: string };
      return User.fromData(data);
    });
  }

  async findById(id: string): Promise<User | null> {
    const docRef = doc(db, this.collection, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data() as User & { password: string };
    return User.fromData(data);
  }

  async update(id: string, user: Partial<User>): Promise<User> {
    const docRef = doc(db, this.collection, id);
    const userData = user.toJSON ? user.toJSON() : user;
    await setDoc(docRef, userData, { merge: true });
    const updatedDoc = await this.findById(id);
    if (!updatedDoc) throw new Error("User not found");

    return updatedDoc;
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collection, id);
    await deleteDoc(docRef);
  }

  async findByEmail(email: string): Promise<User | null> {
    const q = query(
      collection(db, this.collection),
      where("email", "==", email)
    );
    const snapshot = await getDocs(q);
    const userDoc = snapshot.docs[0];
    if (!userDoc) return null;
    const data = userDoc.data() as User & { password: string };
    return User.fromData(data);
  }
}
