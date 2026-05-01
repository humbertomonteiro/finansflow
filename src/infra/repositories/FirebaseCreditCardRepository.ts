import { IRepository } from "@/domain/interfaces/repository/repository";
import { CreditCard } from "@/domain/entities/creditcard/CreditCard";
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
  Timestamp,
} from "firebase/firestore";

export class CreditCardRepositoryFirestore implements IRepository<CreditCard> {
  private collection = "credit_cards";

  async save(card: CreditCard): Promise<CreditCard> {
    const docRef = doc(db, this.collection, card.id);
    await setDoc(docRef, {
      ...card.toJSON(),
      updatedAt: Timestamp.fromDate(card.updatedAt),
    });
    return card;
  }

  async findAll(): Promise<CreditCard[]> {
    const snapshot = await getDocs(collection(db, this.collection));
    return snapshot.docs.map((d) => this.mapToCard(d.data()));
  }

  async findById(id: string): Promise<CreditCard | null> {
    const docRef = doc(db, this.collection, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return this.mapToCard(docSnap.data());
  }

  async update(id: string, card: CreditCard): Promise<CreditCard> {
    const docRef = doc(db, this.collection, id);
    const data = card.toJSON();
    await setDoc(
      docRef,
      {
        ...data,
        updatedAt:
          data.updatedAt instanceof Date
            ? Timestamp.fromDate(data.updatedAt)
            : data.updatedAt,
      },
      { merge: true }
    );
    const updated = await this.findById(id);
    if (!updated) throw new Error("Credit card not found after update");
    return updated;
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collection, id);
    await deleteDoc(docRef);
  }

  async findByUserId(userId: string): Promise<CreditCard[]> {
    const q = query(
      collection(db, this.collection),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => this.mapToCard(d.data()));
  }

  private mapToCard(data: any): CreditCard {
    return CreditCard.fromData({
      id: data.id,
      userId: data.userId,
      name: data.name,
      creditLimit: data.creditLimit || 0,
      closingDay: data.closingDay || 1,
      dueDay: data.dueDay || 10,
      color: data.color || "#7c3aed",
      updatedAt:
        data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : new Date(data.updatedAt),
    });
  }
}
