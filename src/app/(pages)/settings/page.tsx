"use client";

import { Title } from "../../components/shared/Title";
import { BoxUser } from "@/app/components/shared/BoxUser";

import {
  MdOutlineAccountBalance,
  MdOutlineCategory,
  MdOutlineBalance,
  MdOutlineReplay,
  MdAdd,
  MdDelete,
  MdClose,
  MdCheck,
} from "react-icons/md";
import { IoExitOutline } from "react-icons/io5";
import { FiAlertCircle, FiLoader, FiActivity } from "react-icons/fi";
import { BalanceDiagnosticUsecase, AccountDiagnostic } from "@/domain/usecases/account/BalanceDiagnosticUsecase";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/hooks/useUser";
import { IAccount } from "@/domain/interfaces/account/IAccount";
import { ICategory } from "@/domain/interfaces/category/ICategory";

import { createAccountController } from "@/controllers/account/CreateAccountController";
import { removeAccountController } from "@/controllers/account/RemoveAccountController";
import { updateAccountController } from "@/controllers/account/UpdateAccountController";
import { CreateCategoryController } from "@/controllers/category/CreateCategoryController";
import { removeCategoryController } from "@/controllers/category/RemoveCategoryController";

type ActivePanel = null | "accounts" | "categories" | "balance" | "reset" | "diagnostic";

export default function Settings() {
  const {
    user,
    logout,
    loading,
    accounts,
    categories,
    allTransactions,
    refreshAccounts,
    refreshCategories,
    updateAccount,
  } = useUser();
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  // --- Contas ---
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountBalance, setNewAccountBalance] = useState("");
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountSuccess, setAccountSuccess] = useState<string | null>(null);

  // --- Categorias ---
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categorySuccess, setCategorySuccess] = useState<string | null>(null);

  // --- Diagnóstico de Saldo ---
  const [diagnosticData, setDiagnosticData] = useState<AccountDiagnostic[] | null>(null);

  // --- Ajustar Saldo ---
  const [balanceAccountId, setBalanceAccountId] = useState("");
  const [newBalance, setNewBalance] = useState("");
  const [renameName, setRenameName] = useState("");
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceSuccess, setBalanceSuccess] = useState<string | null>(null);

  const runDiagnostic = () => {
    if (!accounts || !allTransactions) return;
    const result = new BalanceDiagnosticUsecase().execute(accounts, allTransactions);
    setDiagnosticData(result);
  };

  // Preenche o nome atual ao selecionar a conta
  useEffect(() => {
    if (balanceAccountId) {
      const acc = accounts?.find((a) => a.id === balanceAccountId);
      setRenameName(acc?.name ?? "");
      setNewBalance(String(acc?.balance ?? ""));
    }
  }, [balanceAccountId, accounts]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const togglePanel = (panel: ActivePanel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
    // Limpa feedbacks ao trocar painel
    setAccountError(null);
    setAccountSuccess(null);
    setCategoryError(null);
    setCategorySuccess(null);
    setBalanceError(null);
    setBalanceSuccess(null);
  };

  // ────────────────────────────────────────────
  // CONTAS
  // ────────────────────────────────────────────
  const handleCreateAccount = async () => {
    setAccountError(null);
    setAccountSuccess(null);

    if (!newAccountName.trim() || newAccountName.trim().length < 3) {
      setAccountError("Nome deve ter ao menos 3 caracteres.");
      return;
    }
    const balance = Number(
      newAccountBalance.replace(",", ".").replace(/[^\d.]/g, ""),
    );
    if (isNaN(balance) || balance < 0) {
      setAccountError("Informe um saldo inicial válido (mínimo 0).");
      return;
    }
    if (!user) return;

    setAccountLoading(true);
    try {
      await createAccountController(user.id, {
        name: newAccountName.trim(),
        balance,
      });
      await refreshAccounts();
      setNewAccountName("");
      setNewAccountBalance("");
      setAccountSuccess(`Conta "${newAccountName.trim()}" criada com sucesso!`);
    } catch (error: any) {
      const msg = error?.message?.includes("3 accounts")
        ? "Limite de 3 contas atingido."
        : "Erro ao criar conta. Tente novamente.";
      setAccountError(msg);
    } finally {
      setAccountLoading(false);
    }
  };

  const handleRemoveAccount = async (account: IAccount) => {
    if (
      !confirm(
        `Remover a conta "${account.name}"? Esta ação não pode ser desfeita.`,
      )
    )
      return;
    setAccountLoading(true);
    setAccountError(null);
    try {
      await removeAccountController(account.id);
      await refreshAccounts();
      setAccountSuccess(`Conta "${account.name}" removida.`);
    } catch {
      setAccountError("Erro ao remover conta.");
    } finally {
      setAccountLoading(false);
    }
  };

  // ────────────────────────────────────────────
  // AJUSTAR SALDO / RENOMEAR CONTA
  // ────────────────────────────────────────────
  const handleUpdateBalance = async () => {
    setBalanceError(null);
    setBalanceSuccess(null);

    if (!balanceAccountId) {
      setBalanceError("Selecione uma conta.");
      return;
    }

    const balance = Number(newBalance.replace(",", ".").replace(/[^\d.]/g, ""));
    if (isNaN(balance) || balance < 0) {
      setBalanceError("Informe um saldo válido (mínimo R$ 0,00).");
      return;
    }

    const trimmedName = renameName.trim();
    if (trimmedName.length < 3) {
      setBalanceError("Nome deve ter ao menos 3 caracteres.");
      return;
    }

    setBalanceLoading(true);
    try {
      await updateAccount(balanceAccountId, {
        balance,
        name: trimmedName,
      });
      setBalanceSuccess("Conta atualizada com sucesso!");
      // Limpa seleção após salvar
      setBalanceAccountId("");
      setNewBalance("");
      setRenameName("");
    } catch (error: any) {
      setBalanceError(error?.message ?? "Erro ao atualizar conta.");
    } finally {
      setBalanceLoading(false);
    }
  };

  // ────────────────────────────────────────────
  // CATEGORIAS
  // ────────────────────────────────────────────
  const handleCreateCategory = async () => {
    setCategoryError(null);
    setCategorySuccess(null);

    if (!newCategoryName.trim() || newCategoryName.trim().length < 2) {
      setCategoryError("Nome deve ter ao menos 2 caracteres.");
      return;
    }
    if (!user) return;

    setCategoryLoading(true);
    try {
      // Agora passa userId como primeiro argumento — categoria fica vinculada ao user
      await CreateCategoryController(user.id, {
        name: newCategoryName.trim(),
        description: newCategoryName.trim(),
      });
      await refreshCategories();
      setCategorySuccess(`Categoria "${newCategoryName.trim()}" criada!`);
      setNewCategoryName("");
    } catch (error: any) {
      const msg = error?.message?.includes("20 categories")
        ? "Limite de 20 categorias personalizadas atingido."
        : "Erro ao criar categoria.";
      setCategoryError(msg);
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleRemoveCategory = async (category: ICategory) => {
    if (!confirm(`Remover a categoria "${category.name}"?`)) return;
    setCategoryLoading(true);
    setCategoryError(null);
    try {
      await removeCategoryController(category.id);
      await refreshCategories();
      setCategorySuccess(`Categoria "${category.name}" removida.`);
    } catch {
      setCategoryError("Erro ao remover categoria.");
    } finally {
      setCategoryLoading(false);
    }
  };

  if (loading) {
    return <p className="text-gray-400 p-6">Carregando...</p>;
  }

  if (!user) return null;

  // Categorias criadas pelo usuário (não são as padrão de id numérico simples)
  const userCreatedCategories =
    categories?.filter((c) => isNaN(Number(c.id))) ?? [];
  const defaultCategories =
    categories?.filter((c) => !isNaN(Number(c.id))) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Title navigateMonth={false}>Configurações</Title>

      <BoxUser />

      <ul className="text-gray-400 flex flex-col bg-gray-900 py-2 px-2 rounded-2xl">
        {/* ── CONTAS ── */}
        <li>
          <button
            onClick={() => togglePanel("accounts")}
            className="w-full flex items-center justify-between gap-4 p-4 hover:bg-gray-800 transition-all cursor-pointer border-b border-b-gray-800 hover:rounded-xl"
          >
            <span className="flex items-center gap-4">
              <MdOutlineAccountBalance className="h-5 w-5" />
              Contas
            </span>
            <span className="text-xs text-gray-600">
              {accounts?.length ?? 0}/3
            </span>
          </button>

          {activePanel === "accounts" && (
            <div className="bg-gray-800 rounded-xl mx-2 mb-2 p-4 flex flex-col gap-4">
              {/* Lista de contas */}
              <div className="flex flex-col gap-2">
                {accounts && accounts.length > 0 ? (
                  accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3"
                    >
                      <div>
                        <p className="text-gray-200 font-medium">
                          {account.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Saldo:{" "}
                          {account.balance.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveAccount(account)}
                        disabled={accountLoading}
                        className="h-8 w-8 rounded-full bg-red-900/50 hover:bg-red-700 flex items-center justify-center text-red-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <MdDelete className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm text-center py-2">
                    Nenhuma conta cadastrada.
                  </p>
                )}
              </div>

              {/* Criar nova conta */}
              {(accounts?.length ?? 0) < 3 && (
                <div className="flex flex-col gap-2 border-t border-gray-700 pt-4">
                  <p className="text-gray-400 text-sm font-medium">
                    Nova conta
                  </p>
                  <input
                    className="input"
                    type="text"
                    placeholder="Nome da conta (ex: Nubank, Carteira)"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                  />
                  <input
                    className="input"
                    type="text"
                    placeholder="Saldo inicial (ex: 1500,00)"
                    value={newAccountBalance}
                    onChange={(e) => setNewAccountBalance(e.target.value)}
                  />
                  {accountError && (
                    <p className="text-red-400 text-xs flex items-center gap-1">
                      <FiAlertCircle className="h-3 w-3" /> {accountError}
                    </p>
                  )}
                  {accountSuccess && (
                    <p className="text-green-400 text-xs flex items-center gap-1">
                      <MdCheck className="h-3 w-3" /> {accountSuccess}
                    </p>
                  )}
                  <button
                    onClick={handleCreateAccount}
                    disabled={accountLoading}
                    className="button bg-violet-700 hover:bg-violet-600 text-white font-semibold disabled:opacity-50"
                  >
                    {accountLoading ? (
                      <span className="flex items-center gap-2">
                        <FiLoader className="h-4 w-4 animate-spin" />
                        Criando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <MdAdd /> Criar Conta
                      </span>
                    )}
                  </button>
                </div>
              )}
              {(accounts?.length ?? 0) >= 3 && (
                <p className="text-yellow-600 text-xs text-center">
                  Limite de 3 contas atingido.
                </p>
              )}
            </div>
          )}
        </li>

        {/* ── CATEGORIAS ── */}
        <li>
          <button
            onClick={() => togglePanel("categories")}
            className="w-full flex items-center justify-between gap-4 p-4 hover:bg-gray-800 transition-all cursor-pointer border-b border-b-gray-800 hover:rounded-xl"
          >
            <span className="flex items-center gap-4">
              <MdOutlineCategory className="h-5 w-5" />
              Categorias
            </span>
            <span className="text-xs text-gray-600">
              {userCreatedCategories.length}/20 personalizadas
            </span>
          </button>

          {activePanel === "categories" && (
            <div className="bg-gray-800 rounded-xl mx-2 mb-2 p-4 flex flex-col gap-4">
              {/* Categorias padrão */}
              <div>
                <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">
                  Padrão
                </p>
                <div className="flex flex-wrap gap-2">
                  {defaultCategories.map((cat) => (
                    <span
                      key={cat.id}
                      className="text-xs bg-gray-700 text-gray-400 px-3 py-1 rounded-full"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Categorias personalizadas */}
              {userCreatedCategories.length > 0 && (
                <div>
                  <p className="text-gray-500 text-xs mb-2 uppercase tracking-wider">
                    Suas categorias
                  </p>
                  <div className="flex flex-col gap-2">
                    {userCreatedCategories.map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-2"
                      >
                        <span className="text-gray-200 text-sm">
                          {cat.name}
                        </span>
                        <button
                          onClick={() => handleRemoveCategory(cat)}
                          disabled={categoryLoading}
                          className="h-7 w-7 rounded-full bg-red-900/50 hover:bg-red-700 flex items-center justify-center text-red-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <MdDelete className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nova categoria */}
              {userCreatedCategories.length < 20 && (
                <div className="flex flex-col gap-2 border-t border-gray-700 pt-4">
                  <p className="text-gray-400 text-sm font-medium">
                    Nova categoria
                  </p>
                  <input
                    className="input"
                    type="text"
                    placeholder="Ex: Viagens, Pets, Academia..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  {categoryError && (
                    <p className="text-red-400 text-xs flex items-center gap-1">
                      <FiAlertCircle className="h-3 w-3" /> {categoryError}
                    </p>
                  )}
                  {categorySuccess && (
                    <p className="text-green-400 text-xs flex items-center gap-1">
                      <MdCheck className="h-3 w-3" /> {categorySuccess}
                    </p>
                  )}
                  <button
                    onClick={handleCreateCategory}
                    disabled={categoryLoading}
                    className="button bg-violet-700 hover:bg-violet-600 text-white font-semibold disabled:opacity-50"
                  >
                    {categoryLoading ? (
                      <span className="flex items-center gap-2">
                        <FiLoader className="h-4 w-4 animate-spin" />
                        Criando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <MdAdd /> Criar Categoria
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </li>

        {/* ── AJUSTAR SALDO ── */}
        <li>
          <button
            onClick={() => togglePanel("balance")}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-800 transition-all cursor-pointer border-b border-b-gray-800 hover:rounded-xl"
          >
            <MdOutlineBalance className="h-5 w-5" />
            Ajustar Saldo
          </button>

          {activePanel === "balance" && (
            <div className="bg-gray-800 rounded-xl mx-2 mb-2 p-4 flex flex-col gap-3">
              <p className="text-gray-400 text-sm">
                Selecione a conta para editar o nome e/ou corrigir o saldo
                manualmente.
              </p>

              {/* Seletor de conta */}
              <div>
                <p className="text-gray-500 text-xs mb-1">Conta</p>
                <select
                  className="input"
                  value={balanceAccountId}
                  onChange={(e) => {
                    setBalanceAccountId(e.target.value);
                    setBalanceError(null);
                    setBalanceSuccess(null);
                  }}
                >
                  <option value="">Selecione uma conta</option>
                  {accounts?.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} —{" "}
                      {acc.balance.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </option>
                  ))}
                </select>
              </div>

              {balanceAccountId && (
                <>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Nome da conta</p>
                    <input
                      className="input"
                      type="text"
                      value={renameName}
                      onChange={(e) => setRenameName(e.target.value)}
                      placeholder="Nome da conta"
                    />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">
                      Saldo atual (R$)
                    </p>
                    <input
                      className="input"
                      type="text"
                      value={newBalance}
                      onChange={(e) => setNewBalance(e.target.value)}
                      placeholder="Ex: 2500,00"
                    />
                  </div>
                </>
              )}

              {balanceError && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <FiAlertCircle className="h-3 w-3" /> {balanceError}
                </p>
              )}
              {balanceSuccess && (
                <p className="text-green-400 text-xs flex items-center gap-1">
                  <MdCheck className="h-3 w-3" /> {balanceSuccess}
                </p>
              )}

              <button
                onClick={handleUpdateBalance}
                disabled={balanceLoading || !balanceAccountId}
                className="button bg-violet-700 hover:bg-violet-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {balanceLoading ? (
                  <span className="flex items-center gap-2">
                    <FiLoader className="h-4 w-4 animate-spin" />
                    Salvando...
                  </span>
                ) : (
                  "Salvar alterações"
                )}
              </button>

              <p className="text-yellow-600/70 text-xs">
                ⚠️ O ajuste de saldo altera diretamente o valor armazenado no
                banco, independente das transações.
              </p>
            </div>
          )}
        </li>

        {/* ── DIAGNÓSTICO DE SALDO ── */}
        <li>
          <button
            onClick={() => {
              togglePanel("diagnostic");
              if (activePanel !== "diagnostic") runDiagnostic();
            }}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-800 transition-all cursor-pointer border-b border-b-gray-800 hover:rounded-xl"
          >
            <FiActivity className="h-5 w-5" />
            Diagnóstico de Saldo
          </button>

          {activePanel === "diagnostic" && (
            <div className="bg-gray-800 rounded-xl mx-2 mb-2 p-4 flex flex-col gap-4">
              <p className="text-gray-400 text-sm">
                Compara o saldo armazenado de cada conta com o saldo calculado
                com base em todas as transações pagas. A diferença indica ajustes
                manuais ou transações não cadastradas.
              </p>

              {diagnosticData ? (
                <div className="flex flex-col gap-3">
                  {diagnosticData.map((d) => {
                    const fmt = (v: number) =>
                      v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                    const isOk = Math.abs(d.difference) < 0.01;
                    const diffColor = isOk
                      ? "text-green-400"
                      : d.difference > 0
                      ? "text-yellow-400"
                      : "text-red-400";
                    return (
                      <div
                        key={d.accountId}
                        className="bg-gray-900 rounded-xl p-4 flex flex-col gap-2"
                      >
                        <p className="text-gray-200 font-semibold text-sm">
                          {d.accountName}
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div>
                            <p className="text-gray-600 uppercase tracking-wide text-[0.65rem]">Saldo armazenado</p>
                            <p className="text-gray-300">{fmt(d.storedBalance)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 uppercase tracking-wide text-[0.65rem]">Calculado pelas transações</p>
                            <p className="text-gray-300">{fmt(d.calculatedBalance)}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-600 uppercase tracking-wide text-[0.65rem]">Diferença</p>
                            <p className={`font-semibold ${diffColor}`}>
                              {isOk
                                ? "Sem diferença — tudo certo"
                                : `${d.difference > 0 ? "+" : ""}${fmt(d.difference)} (ajuste manual ou saldo inicial)`}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    onClick={runDiagnostic}
                    className="button bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm cursor-pointer"
                  >
                    Recalcular
                  </button>
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-2">
                  Nenhum dado disponível.
                </p>
              )}
            </div>
          )}
        </li>

        {/* ── RECOMEÇAR ── */}
        <li>
          <button
            onClick={() => togglePanel("reset")}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-800 transition-all cursor-pointer border-b border-b-gray-800 hover:rounded-xl"
          >
            <MdOutlineReplay className="h-5 w-5" />
            Começar do zero
          </button>
          {activePanel === "reset" && (
            <div className="bg-gray-800 rounded-xl mx-2 mb-2 p-4">
              <p className="text-red-400 text-sm mb-3">
                Atenção: Esta ação irá apagar todas as suas transações e contas.
                Esta operação é irreversível.
              </p>
              <button
                disabled
                className="button bg-red-900/50 text-red-400 cursor-not-allowed opacity-60 w-full"
              >
                Em breve
              </button>
            </div>
          )}
        </li>

        {/* ── SAIR ── */}
        <li
          onClick={handleLogout}
          className="flex gap-4 p-4 hover:bg-red-800 hover:text-gray-200 transition-all cursor-pointer hover:rounded-xl"
        >
          <div className="flex items-center gap-4">
            <IoExitOutline className="h-5 w-5" />
            {loading ? "Carregando..." : "Sair"}
          </div>
        </li>
      </ul>
    </div>
  );
}
