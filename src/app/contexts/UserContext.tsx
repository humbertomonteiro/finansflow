"use client";

import { createContext, useEffect, useState } from "react";

import { IUser } from "@/domain/interfaces/user/IUser";
import { IAccount } from "@/domain/interfaces/account/IAccount";
import { ICategory } from "@/domain/interfaces/category/ICategory";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { IGoal } from "@/domain/interfaces/goal/IGoal";

import { auth } from "@/infra/services/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

import { TransactionRemovalScope } from "@/domain/enums/transaction/TransactionRemovalScope";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";

import { listAccountByUserController } from "@/controllers/account/ListAccountByUserController";
import { listCategoryController } from "@/controllers/category/ListCategoryController";
import { payerTransactionController } from "@/controllers/transaction/PayerTransactionController";
import { ListAllTransactionsController } from "@/controllers/transaction/ListAllTransactionsController";
import { editTransactionController, EditScope } from "@/controllers/transaction/EditTransactionController";
import { RemoveTransactionController } from "@/controllers/transaction/RemoveTransactionController";
import { logoutController } from "@/controllers/user/LogoutController";
import { UpdateUserController } from "@/controllers/user/UpdateUserController";
import { updateAccountController } from "@/controllers/account/UpdateAccountController";
import { ListGoalsByUserController } from "@/controllers/goal/ListGoalsByUserController";
import { CreateGoalController } from "@/controllers/goal/CreateGoalController";
import { UpdateGoalController } from "@/controllers/goal/UpdateGoalController";
import { DeleteGoalController } from "@/controllers/goal/DeleteGoalController";

import { FilteredTransactionsListUsecase } from "@/domain/usecases/transaction/FilteredTransactionsListUsecase";
import { MetricsUsecase } from "@/domain/usecases/account/MetricsUsecase";
import {
  CategoryExpensesSummary,
  CalculateCategoryExpensesUsecase,
} from "@/domain/usecases/transaction/CalculateCategoryExpensesUsecase";

import { MetricsType } from "@/domain/usecases/account/MetricsUsecase";
import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import {
  AnnualMetricsUsecase,
  AnnualMetrics,
} from "@/domain/usecases/transaction/AnnualMetricsUsecase";

import { useRouter } from "next/navigation";

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
  projectedBalance: number;
  monthlyMetrics: AnnualMetrics | null;
  dataCategoryExpenses: CategoryExpensesSummary | null;
  month: number;
  year: number;
  setMonth: (month: number) => void;
  setYear: (year: number) => void;
  payTransaction: (transactionId: string, paidAccountId?: string, overrideYear?: number, overrideMonth?: number) => Promise<void>;
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
  logout: () => Promise<void>;
  updateUser: (userData: Partial<IUser>) => Promise<void>;
  refreshAccounts: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  updateAccount: (
    accountId: string,
    props: { name?: string; balance?: number }
  ) => Promise<void>;
  goals: IGoal[] | null;
  addGoal: (categoryId: string, monthlyLimit: number) => Promise<void>;
  updateGoal: (goalId: string, monthlyLimit: number) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
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
  projectedBalance: 0,
  monthlyMetrics: null,
  dataCategoryExpenses: null,
  month: 0,
  year: 0,
  setMonth: () => {},
  setYear: () => {},
  payTransaction: async () => {},
  editTransaction: async () => {},
  removeTransaction: async () => "x",
  updateTransaction: () => {},
  loading: false,
  logout: async () => {},
  updateUser: async () => {},
  refreshAccounts: async () => {},
  refreshCategories: async () => {},
  updateAccount: async () => {},
  goals: null,
  addGoal: async () => {},
  updateGoal: async () => {},
  deleteGoal: async () => {},
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
  const [projectedBalance, setProjectedBalance] = useState<number>(0);
  const [monthlyMetrics, setMonthlyMetrics] = useState<AnnualMetrics | null>(
    null
  );
  const [dataCategoryExpenses, setDataCategoryExpenses] =
    useState<CategoryExpensesSummary | null>(null);
  const [goals, setGoals] = useState<IGoal[] | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(true);

      if (user) {
        // FIX: guarda check de SSR antes de usar localStorage
        if (typeof window !== "undefined") {
          const userLocalStorage = localStorage.getItem("user-finan-flow");
          if (userLocalStorage) {
            setUser(JSON.parse(userLocalStorage) as IUser);
          } else {
            setUser(user as unknown as IUser);
          }
        } else {
          setUser(user as unknown as IUser);
        }
      } else {
        setUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("user-finan-flow");
        }
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
      fetchGoals();
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

  // Saldo projetado = saldo atual + todos os payments não pagos com vencimento ≤ mês navegado.
  // Responde à navegação de mês: navegar para o futuro acumula os próximos pendentes.
  useEffect(() => {
    if (!allTransactions) {
      setProjectedBalance(currentBalance);
      return;
    }

    const sign = (t: ITransaction) =>
      t.type === TransactionTypes.DEPOSIT ? 1 : -1;

    let pending = 0;

    for (const t of allTransactions) {
      if (t.type === TransactionTypes.TRANSFER) continue;

      if (t.kind === TransactionKind.SIMPLE) {
        for (const p of t.paymentHistory) {
          if (p.isPaid) continue;
          const d = new Date(p.dueDate);
          if (d.getFullYear() < year || (d.getFullYear() === year && d.getMonth() + 1 <= month)) {
            pending += sign(t) * p.amount;
          }
        }
      } else if (t.kind === TransactionKind.INSTALLMENT) {
        const excl = t.recurrence?.excludedInstallments ?? [];
        t.paymentHistory.forEach((p, idx) => {
          if (excl.includes(idx + 1)) return;
          if (p.isPaid) return;
          const d = new Date(p.dueDate);
          if (d.getFullYear() < year || (d.getFullYear() === year && d.getMonth() + 1 <= month)) {
            pending += sign(t) * p.amount;
          }
        });
      } else if (t.kind === TransactionKind.FIXED) {
        const startDate = new Date(t.dueDate);
        const endDate = t.recurrence?.endDate ? new Date(t.recurrence.endDate) : null;
        const excl = (t.recurrence?.excludedFixeds ?? []) as Array<{ year: number; month: number }>;

        let y = startDate.getFullYear();
        let m = startDate.getMonth() + 1;

        while (y < year || (y === year && m <= month)) {
          const occ = new Date(y, m - 1, startDate.getDate());
          if (endDate && occ > endDate) break;

          const isExcluded = excl.some((ef) => ef.year === y && ef.month === m);
          if (!isExcluded) {
            const payRecord = t.paymentHistory.find((p) => {
              const d = new Date(p.dueDate);
              return d.getFullYear() === y && d.getMonth() + 1 === m;
            });
            if (!(payRecord?.isPaid ?? false)) {
              pending += sign(t) * (payRecord?.amount ?? t.amount);
            }
          }

          m++;
          if (m > 12) { m = 1; y++; }
        }
      }
    }

    setProjectedBalance(currentBalance + pending);
  }, [allTransactions, currentBalance, year, month]);

  const logout = async () => {
    setLoading(true);
    try {
      await logoutController();
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("user-finan-flow");
      }
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      throw new Error("Erro ao fazer logout");
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (
    userData: Partial<IUser & { password: string }>
  ) => {
    if (!user) {
      throw new Error("Nenhum usuário logado");
    }
    setLoading(true);
    try {
      const updatedUser = await UpdateUserController(user.id, {
        name: userData.name,
      });
      setUser(updatedUser);
      if (typeof window !== "undefined") {
        localStorage.setItem("user-finan-flow", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Error updating user:", error);
      throw new Error("Falha ao atualizar usuário: " + error);
    } finally {
      setLoading(false);
    }
  };

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

  // Exposto publicamente para que Settings possa recarregar após criar/remover conta
  const refreshAccounts = async () => {
    await fetchAccounts();
  };

  // Exposto publicamente para que Settings possa recarregar após criar/remover categoria
  const refreshCategories = async () => {
    await fetchCategories();
  };

  const fetchAllTransactions = async () => {
    if (accounts) {
      try {
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

  const fetchGoals = async () => {
    if (user) {
      try {
        const data = await ListGoalsByUserController(user.id);
        setGoals(data);
      } catch (error) {
        console.error("Error fetching goals:", error);
      }
    }
  };

  const addGoal = async (categoryId: string, monthlyLimit: number) => {
    if (!user) throw new Error("Nenhum usuário logado");
    const newGoal = await CreateGoalController(user.id, categoryId, monthlyLimit);
    setGoals((prev) => (prev ? [...prev, newGoal] : [newGoal]));
  };

  const updateGoal = async (goalId: string, monthlyLimit: number) => {
    const updated = await UpdateGoalController(goalId, monthlyLimit);
    setGoals((prev) =>
      prev ? prev.map((g) => (g.id === goalId ? updated : g)) : [updated]
    );
  };

  const deleteGoal = async (goalId: string) => {
    await DeleteGoalController(goalId);
    setGoals((prev) => (prev ? prev.filter((g) => g.id !== goalId) : []));
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

      if (categories) {
        const dataCategoryExpense =
          new CalculateCategoryExpensesUsecase().execute(
            transactions,
            categories
          );
        setDataCategoryExpenses(dataCategoryExpense);
      }
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
          year
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

  const payTransaction = async (transactionId: string, paidAccountId?: string, overrideYear?: number, overrideMonth?: number) => {
    const effectiveYear = overrideYear ?? year;
    const effectiveMonth = overrideMonth ?? month;
    try {
      if (user && currentBalance !== null) {
        const updatedTransaction = await payerTransactionController(
          transactionId,
          effectiveYear,
          effectiveMonth,
          paidAccountId
        );

        if (updatedTransaction) {
          updateTransaction(updatedTransaction);

          if (updatedTransaction.type === TransactionTypes.TRANSFER) {
            // Transferência entre contas próprias: saldo total não muda,
            // mas os saldos individuais mudam — recarrega do Firestore
            await fetchAccounts();
            return;
          }

          const paymentRecord = updatedTransaction.paymentHistory.find(
            (payment) =>
              payment.dueDate.getFullYear() === effectiveYear &&
              payment.dueDate.getMonth() + 1 === effectiveMonth
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
              return newBalance;
            });
          }
        }
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
      const updatedTransaction = await editTransactionController(
        transactionId,
        newTransaction,
        EditScope.ALL
      );

      setAllTransactions((prevTransactions) => {
        if (!prevTransactions) return null;
        return prevTransactions.map((t) =>
          t.id === updatedTransaction.id ? updatedTransaction : t
        );
      });
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
  ): Promise<string> => {
    setLoading(true);
    try {
      const { message, balanceUpdate, removeCurrentMonth, needsAccountRefresh } =
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

            if (!removeCurrentMonth) return t;

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
                      excludedInstallments,
                    },
                  }
                : t;
            } else if (removeCurrentMonth.date) {
              const excludedFixeds = recurrence.excludedFixeds
                ? [...recurrence.excludedFixeds, ...removeCurrentMonth.date]
                : [...removeCurrentMonth.date];

              return t.id === transactionId
                ? {
                    ...t,
                    recurrence: {
                      ...t.recurrence,
                      excludedFixeds,
                    },
                  }
                : t;
            }

            return t;
          });
        }

        return prevTransactions;
      });

      if (needsAccountRefresh) {
        await fetchAccounts();
      } else {
        setCurrentBalance(balanceUpdate);
      }
      return message;
    } catch (error) {
      console.error("Failed to remove transaction:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };


  const addTransaction = async (newTransaction: ITransaction) => {
    setAllTransactions((prevTransactions) => {
      const updatedTransactions = prevTransactions
        ? [...prevTransactions, newTransaction]
        : [newTransaction];
      return updatedTransactions;
    });
  };

  const updateAccount = async (
    accountId: string,
    props: { name?: string; balance?: number }
  ) => {
    if (!user) throw new Error("Nenhum usuário logado");
    setLoading(true);
    try {
      const updated = await updateAccountController(accountId, user.id, props);
      // Atualiza o estado local sem novo fetch ao Firebase
      setAccounts((prev) => {
        if (!prev) return prev;
        const next = prev.map((a) => (a.id === updated.id ? updated : a));
        const total = next.reduce((sum, a) => sum + a.balance, 0);
        setCurrentBalance(total);
        return next;
      });
    } catch (error) {
      console.error("Error updating account:", error);
      throw error;
    } finally {
      setLoading(false);
    }
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
        projectedBalance,
        monthlyMetrics,
        dataCategoryExpenses,
        month,
        year,
        setMonth,
        setYear,
        payTransaction,
        editTransaction,
        removeTransaction,
        updateTransaction,
        loading,
        logout,
        updateUser,
        refreshAccounts,
        refreshCategories,
        updateAccount,
        goals,
        addGoal,
        updateGoal,
        deleteGoal,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
