import { IRepository } from "@/domain/interfaces/repository/repository";
import { Account } from "@/domain/entities/account/Account";
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

export class AccountRepositoryFirestore implements IRepository<Account> {
  private collection = "accounts";

  async save(account: Account): Promise<Account> {
    const docRef = doc(db, this.collection, account.id);
    await setDoc(docRef, {
      ...account.toJSON(),
      updatedAt: Timestamp.fromDate(account.updatedAt),
    });

    return account;
  }

  async findAll(): Promise<Account[]> {
    const snapshot = await getDocs(collection(db, this.collection));
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return Account.fromData({
        id: data.id,
        name: data.name,
        balance: data.balance || 0,
        transactionsIds: data.transactionsIds || [],
        updatedAt:
          data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate()
            : new Date(data.updatedAt),
      });
    });
  }

  async findById(id: string): Promise<Account | null> {
    const docRef = doc(db, this.collection, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return Account.fromData({
      id: data.id,
      name: data.name,
      balance: data.balance || 0,
      transactionsIds: data.transactionsIds || [],
      updatedAt:
        data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : new Date(data.updatedAt),
    });
  }

  async update(id: string, account: Partial<Account>): Promise<Account> {
    const docRef = doc(db, this.collection, id);
    const updateData = account.toJSON ? account.toJSON() : account;
    // Criar um novo objeto para evitar modificar propriedades readonly
    const firestoreData = {
      ...updateData,
      updatedAt:
        updateData.updatedAt instanceof Date
          ? Timestamp.fromDate(updateData.updatedAt)
          : updateData.updatedAt,
    };
    await setDoc(docRef, firestoreData, { merge: true });
    const updatedDoc = await this.findById(id);
    if (!updatedDoc) throw new Error("Account not found");

    return updatedDoc;
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collection, id);
    await deleteDoc(docRef);
  }

  async findByEmail(email: string): Promise<Account | null> {
    const q = query(
      collection(db, this.collection),
      where("email", "==", email)
    );
    const snapshot = await getDocs(q);
    const accountDoc = snapshot.docs[0];
    if (!accountDoc) return null;
    const data = accountDoc.data();
    return Account.fromData({
      id: data.id,
      name: data.name,
      balance: data.balance || 0,
      transactionsIds: data.transactionsIds || [],
      updatedAt:
        data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : new Date(data.updatedAt),
    });
  }
}
