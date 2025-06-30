"use client";

import { createContext, useEffect, useState } from "react";
import router from "next/router";

import { IUser } from "@/domain/interfaces/user/IUser";
import { IAccount } from "@/domain/interfaces/account/IAccount";
import { ICategory } from "@/domain/interfaces/category/ICategory";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";

import { auth } from "@/infra/services/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

import { TransactionRemovalScope } from "@/domain/enums/transaction/TransactionRemovalScope";

import { listAccountByUserController } from "@/controllers/account/ListAccountByUserController";
import { listCategoryController } from "@/controllers/category/ListCategoryController";
import { payerTransactionController } from "@/controllers/transaction/PayerTransactionController";
import { ListAllTransactionsController } from "@/controllers/transaction/ListAllTransactionsController";
import { EditiTransactionController } from "@/controllers/transaction/EditTransactionController";
import { RemoveTransactionController } from "@/controllers/transaction/RemoveTransactionController";

import { FilteredTransactionsListUsecase } from "@/domain/usecases/transaction/FilteredTransactionsListUsecase";
import { MetricsUsecase } from "@/domain/usecases/account/MetricsUsecase";
import { MetricsType } from "@/domain/usecases/account/MetricsUsecase";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import {
  AnnualMetricsUsecase,
  AnnualMetrics,
} from "@/domain/usecases/transaction/AnnualMetricsUsecase";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";

const filteredTransactionsListUsecase = new FilteredTransactionsListUsecase();

interface UserContextType {
  user: IUser | null;
  signed: boolean;
  setUser: (user: IUser | null) => void;
  accounts: IAccount[] | null;
  categories: ICategory[] | null;
  allTransactions: ITransaction[] | null;
  transactions: ITransaction[] | null;
  nearbyTransactions: ITransaction[] | null;
  overdueTransactions: ITransaction[] | null;
  paidTransactions: ITransaction[] | null;
  unpaidTransactions: ITransaction[] | null;
  addTransaction: (transaction: ITransaction) => void;
  filterTransactions: FiltersTransactios;
  setFilterTransactions: (filter: FiltersTransactios) => void;
  metrics: MetricsType | null;
  currentBalance: number;
  accumulatedFutureBalance: number;
  monthlyMetrics: AnnualMetrics | null;
  month: number;
  year: number;
  setMonth: (month: number) => void;
  setYear: (year: number) => void;
  payTransaction: (transactionId: string) => Promise<void>;
  editTransaction: (
    transactionId: string,
    newTransaction: Partial<ITransaction>
  ) => Promise<void>;
  removeTransaction: (
    transactionId: string,
    scope: TransactionRemovalScope,
    year?: number,
    month?: number
  ) => Promise<string>;
  updateTransaction: (updatedTransaction: ITransaction) => void;
  loading: boolean;
}

export const UserContext = createContext<UserContextType>({
  user: null,
  signed: false,
  setUser: () => {},
  accounts: null,
  categories: null,
  allTransactions: null,
  transactions: null,
  nearbyTransactions: null,
  overdueTransactions: null,
  paidTransactions: null,
  unpaidTransactions: null,
  addTransaction: () => {},
  filterTransactions: "all",
  setFilterTransactions: () => {},
  metrics: null,
  currentBalance: 0,
  accumulatedFutureBalance: 0,
  monthlyMetrics: null,
  month: 0,
  year: 0,
  setMonth: () => {},
  setYear: () => {},
  payTransaction: async () => {},
  editTransaction: async () => {},
  removeTransaction: async () => "x",
  updateTransaction: () => {},
  loading: false,
});

type FiltersTransactios = "all" | "paid" | "unpaid" | "nearby" | "overdue";

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [accounts, setAccounts] = useState<IAccount[] | null>(null);
  const [categories, setCategories] = useState<ICategory[] | null>(null);
  const [allTransactions, setAllTransactions] = useState<ITransaction[] | null>(
    null
  );
  const [transactions, setTransactions] = useState<ITransaction[] | null>(null);
  const [nearbyTransactions, setNearbyTransactions] = useState<
    ITransaction[] | null
  >(null);
  const [overdueTransactions, setOverdueTransactions] = useState<
    ITransaction[] | null
  >(null);
  const [paidTransactions, setPaidTransactions] = useState<
    ITransaction[] | null
  >(null);
  const [unpaidTransactions, setUnpaidTransactions] = useState<
    ITransaction[] | null
  >(null);
  const [filterTransactions, setFilterTransactions] =
    useState<FiltersTransactios>("all");
  const [metrics, setMetrics] = useState<MetricsType | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [accumulatedFutureBalance, setAccumulatedFutureBalance] =
    useState<number>(0);
  const [monthlyMetrics, setMonthlyMetrics] = useState<AnnualMetrics | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(true);

      if (user) {
        const userLocalStorage = localStorage.getItem("user-finan-flow");
        if (userLocalStorage) {
          setUser(JSON.parse(userLocalStorage) as IUser);
        } else {
          setUser(user as unknown as IUser);
        }
      } else {
        setUser(null);
        localStorage.removeItem("user-finan-flow");
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAccounts();
      fetchCategories();
    }
  }, [user]);

  useEffect(() => {
    if (accounts) {
      fetchAllTransactions();
    }
  }, [accounts]);

  useEffect(() => {
    if (allTransactions) {
      fetchTransactions();
    }
  }, [allTransactions, year, month, filterTransactions]);

  useEffect(() => {
    if (transactions) {
      fetchMetrics();
    }
  }, [transactions, accounts, month, year]);

  useEffect(() => {
    if (allTransactions && year) {
      fetchAnnualMetrics();
    }
  }, [allTransactions, year]);

  useEffect(() => {
    updateAccumulatedBalance();
  }, [month, year]);

  const fetchAccounts = async () => {
    if (user) {
      try {
        const accounts = await listAccountByUserController(user.id);

        const totalBalance = accounts.reduce(
          (sum, account) => sum + account.balance,
          0
        );

        setCurrentBalance(totalBalance);
        setAccounts(accounts);
      } catch (error) {
        console.error("Error fetching accounts:", error);
      }
    }
  };

  const fetchAllTransactions = async () => {
    if (accounts) {
      try {
        console.log(
          `Fetching all transactions for accounts: ${accounts
            .map((a) => a.id)
            .join(", ")}`
        );
        const allTransactionsSet = new Set<string>();
        const newTransactions: ITransaction[] = [];

        for (const account of accounts) {
          const transactions = await ListAllTransactionsController(account.id);
          for (const transaction of transactions || []) {
            if (!allTransactionsSet.has(transaction.id)) {
              allTransactionsSet.add(transaction.id);
              newTransactions.push(transaction);
            }
          }
        }

        setAllTransactions(newTransactions);
      } catch (error) {
        console.error("Error fetching all transactions:", error);
        setAllTransactions(null);
      }
    }
  };

  const fetchCategories = async () => {
    if (user) {
      try {
        const categories = await listCategoryController(user.id);
        setCategories(categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }
  };

  const fetchTransactions = async () => {
    if (allTransactions) {
      const transactions = await filteredTransactionsListUsecase.execute(
        allTransactions,
        "all",
        year,
        month
      );
      const nearbyTransaction = await filteredTransactionsListUsecase.execute(
        allTransactions,
        "nearby",
        year,
        month
      );
      const overdueTransaction = await filteredTransactionsListUsecase.execute(
        allTransactions,
        "overdue"
      );
      const paidTransaction = await filteredTransactionsListUsecase.execute(
        allTransactions,
        "paid",
        year,
        month
      );
      const unpaidTransaction = await filteredTransactionsListUsecase.execute(
        allTransactions,
        "unpaid",
        year,
        month
      );

      setTransactions(transactions);
      setNearbyTransactions(nearbyTransaction);
      setOverdueTransactions(overdueTransaction);
      setPaidTransactions(paidTransaction);
      setUnpaidTransactions(unpaidTransaction);
    }
  };

  const fetchMetrics = async () => {
    if (user) {
      try {
        const metrics = await new MetricsUsecase().execute(
          transactions,
          accounts,
          month,
          year
        );
        setMetrics(metrics);

        localStorage.setItem(
          `futureBalance${year}/${month}`,
          JSON.stringify({ balance: metrics.futureBalance })
        );
      } catch (error) {
        console.error("Error fetching metrics:", error);
      }
    }
  };

  const fetchAnnualMetrics = async () => {
    if (user && allTransactions) {
      try {
        setLoading(true);
        const annualData = await new AnnualMetricsUsecase().execute(
          allTransactions,
          year // Use o estado `year` do seu contexto
        );
        setMonthlyMetrics(annualData);
      } catch (error) {
        console.error("Error fetching annual metrics:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const updateTransaction = (updatedTransaction: ITransaction) => {
    setAllTransactions((prevTransactions) => {
      if (!prevTransactions) return null;
      return prevTransactions.map((t) =>
        t.id === updatedTransaction.id ? updatedTransaction : t
      );
    });
  };

  const payTransaction = async (transactionId: string) => {
    try {
      if (user && currentBalance !== null) {
        const updatedTransaction = await payerTransactionController(
          transactionId,
          year,
          month
        );

        if (updatedTransaction) {
          updateTransaction(updatedTransaction);

          const paymentRecord = updatedTransaction.paymentHistory.find(
            (payment) =>
              payment.dueDate.getFullYear() === year &&
              payment.dueDate.getMonth() + 1 === month
          );

          if (paymentRecord) {
            const amount = paymentRecord.amount;

            setCurrentBalance((prevBalance) => {
              let newBalance = prevBalance ?? 0;
              if (paymentRecord.isPaid) {
                if (updatedTransaction.type === TransactionTypes.DEPOSIT) {
                  newBalance += amount;
                } else if (
                  updatedTransaction.type === TransactionTypes.WITHDRAW
                ) {
                  newBalance -= amount;
                }
              } else {
                if (updatedTransaction.type === TransactionTypes.DEPOSIT) {
                  newBalance -= amount;
                } else if (
                  updatedTransaction.type === TransactionTypes.WITHDRAW
                ) {
                  newBalance += amount;
                }
              }
              console.log("Novo saldo:", newBalance);
              return newBalance;
            });
          }
        }
      } else {
        console.log("No user logged in or balance is not initialized");
      }
    } catch (error) {
      console.error("PayTransaction error:", error);
    }
  };

  const editTransaction = async (
    transactionId: string,
    newTransaction: Partial<ITransaction>
  ): Promise<void> => {
    setLoading(true);
    try {
      // Chama o seu controller para executar a lógica de negócio
      const updatedTransaction = await EditiTransactionController(
        transactionId,
        newTransaction
      );

      // Atualize o estado local da aplicação com a transação modificada
      setAllTransactions((prevTransactions) => {
        if (!prevTransactions) return null;

        // Encontre a transação no estado e substitua-a
        return prevTransactions.map((t) =>
          t.id === updatedTransaction.id ? updatedTransaction : t
        );
      });

      // return updatedTransaction;
    } catch (error) {
      console.error("Failed to edit transaction:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeTransaction = async (
    transactionId: string,
    scope: TransactionRemovalScope = TransactionRemovalScope.ALL
    // year?: number,
    // month?: number
  ): Promise<string> => {
    setLoading(true);
    try {
      // Chama o controller para remover a transação no backend
      const { message, balanceUpdate, removeCurrentMonth } =
        await RemoveTransactionController(transactionId, scope, year, month);

      setAllTransactions((prevTransactions) => {
        if (!prevTransactions) return null;

        if (scope === TransactionRemovalScope.ALL) {
          return prevTransactions.filter((t) => t.id !== transactionId);
        }

        if (scope === TransactionRemovalScope.FROM_MONTH_ONWARD) {
          return prevTransactions.map((t) =>
            t.id === transactionId
              ? {
                  ...t,
                  recurrence: {
                    ...t.recurrence,
                    endDate: new Date(year, month - 2, t.dueDate.getDate()),
                  },
                }
              : t
          );
        }

        if (scope === TransactionRemovalScope.CURRENT_MONTH) {
          return prevTransactions.map((t) => {
            const { recurrence } = t;

            if (!removeCurrentMonth) {
              return t;
            }

            if (removeCurrentMonth.index) {
              const excludedInstallments: number[] =
                recurrence.excludedInstallments
                  ? [
                      ...recurrence.excludedInstallments,
                      ...removeCurrentMonth.index,
                    ]
                  : [...removeCurrentMonth.index];

              return t.id === transactionId
                ? {
                    ...t,
                    recurrence: {
                      ...t.recurrence,
                      excludedInstallments: excludedInstallments,
                    },
                  }
                : t;
            } else if (removeCurrentMonth.date) {
              const excludedFixeds = recurrence.excludedFixeds
                ? [...recurrence.excludedFixeds, ...removeCurrentMonth.date]
                : [...removeCurrentMonth?.date];

              return t.id === transactionId
                ? {
                    ...t,
                    recurrence: {
                      ...t.recurrence,
                      excludedFixeds: excludedFixeds,
                    },
                  }
                : t;
            } else {
              return t;
            }
          });
        }

        return prevTransactions;
      });

      setCurrentBalance(balanceUpdate);

      return message;
    } catch (error) {
      console.error("Failed to remove transaction:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateAccumulatedBalance = () => {
    let total = 0;
    const currentYear = year;
    const currentMonth = month;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key && key.startsWith("futureBalance")) {
        const [storedYear, storedMonth] = key
          .replace("futureBalance", "")
          .split("/")
          .map(Number);

        if (
          storedYear < currentYear ||
          (storedYear === currentYear && storedMonth <= currentMonth)
        ) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const { balance } = JSON.parse(item);
              total += balance;
            } catch (error) {
              console.error(`Error parsing ${key}:`, error);
            }
          }
        }
      }
    }
    setAccumulatedFutureBalance(total);
  };

  const addTransaction = async (newTransaction: ITransaction) => {
    setAllTransactions((prevTransactions) => {
      const updatedTransactions = prevTransactions
        ? [...prevTransactions, newTransaction]
        : [newTransaction];
      return updatedTransactions;
    });
  };

  return (
    <UserContext.Provider
      value={{
        user,
        signed: !!user,
        setUser,
        accounts,
        categories,
        allTransactions,
        transactions,
        nearbyTransactions,
        overdueTransactions,
        paidTransactions,
        unpaidTransactions,
        addTransaction,
        filterTransactions,
        setFilterTransactions,
        metrics,
        currentBalance,
        accumulatedFutureBalance,
        monthlyMetrics,
        month,
        year,
        setMonth,
        setYear,
        payTransaction,
        editTransaction,
        removeTransaction,
        updateTransaction,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
