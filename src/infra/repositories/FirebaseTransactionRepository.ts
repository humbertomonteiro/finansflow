import { IRepository } from "@/domain/interfaces/repository/repository";
import { Transaction } from "@/domain/entities/transaction/Transaction";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
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

export class TransactionRepositoryFirestore
  implements IRepository<Transaction>
{
  private collection = "transactions";

  async save(transaction: Transaction): Promise<Transaction> {
    const docRef = doc(db, this.collection, transaction.id);
    await setDoc(docRef, {
      ...transaction,
      dueDate: Timestamp.fromDate(transaction.dueDate),
      paymentHistory: (transaction.paymentHistory || []).map((payment) => ({
        ...payment,
        dueDate: Timestamp.fromDate(payment.dueDate),
        paidAt: payment.paidAt ? Timestamp.fromDate(payment.paidAt) : null,
      })),
    });

    return transaction;
  }

  async findAll(): Promise<Transaction[]> {
    const snapshot = await getDocs(collection(db, this.collection));
    const transactions = snapshot.docs.map((doc) =>
      this.mapToTransaction(doc.data())
    );
    return transactions;
  }

  async findById(id: string): Promise<Transaction | null> {
    const docRef = doc(db, this.collection, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      console.log(`Transaction ${id} not found`);
      return null;
    }
    const transaction = this.mapToTransaction(docSnap.data());
    return transaction;
  }

  async update(
    id: string,
    transaction: Partial<Transaction>
  ): Promise<Transaction> {
    const docRef = doc(db, this.collection, id);
    const updateData = {
      ...transaction,
      dueDate:
        transaction.dueDate instanceof Date
          ? Timestamp.fromDate(transaction.dueDate)
          : transaction.dueDate,
      paymentHistory: transaction.paymentHistory
        ? transaction.paymentHistory.map((payment) => ({
            ...payment,
            dueDate:
              payment.dueDate instanceof Date
                ? Timestamp.fromDate(payment.dueDate)
                : payment.dueDate,
            paidAt:
              payment.paidAt instanceof Date
                ? Timestamp.fromDate(payment.paidAt)
                : payment.paidAt,
          }))
        : undefined,
    };

    await setDoc(docRef, updateData, { merge: true });

    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      return this.mapToTransaction(updatedDoc.data());
    }
    throw new Error("Failed to retrieve updated transaction.");
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collection, id);
    await deleteDoc(docRef);
  }

  async findByEmail(email: string): Promise<Transaction | null> {
    const q = query(
      collection(db, this.collection),
      where("email", "==", email)
    );
    const snapshot = await getDocs(q);
    const accountDoc = snapshot.docs[0];
    if (!accountDoc) {
      console.log(`No transaction found for email ${email}`);
      return null;
    }
    const transaction = this.mapToTransaction(accountDoc.data());
    return transaction;
  }

  async getTransactionsForAccount(accountId: string): Promise<Transaction[]> {
    const q = query(
      collection(db, "transactions"),
      where("accountId", "==", accountId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => this.mapToTransaction(doc.data()));
  }

  private mapToTransaction(data: any): Transaction {
    return {
      ...data,
      dueDate:
        data.dueDate instanceof Timestamp
          ? data.dueDate.toDate()
          : new Date(data.dueDate),
      paymentHistory: (data.paymentHistory || []).map((payment: any) => ({
        ...payment,
        dueDate:
          payment.dueDate instanceof Timestamp
            ? payment.dueDate.toDate()
            : new Date(payment.dueDate),
        paidAt:
          payment.paidAt instanceof Timestamp
            ? payment.paidAt.toDate()
            : payment.paidAt,
      })),
    } as Transaction;
  }
}
