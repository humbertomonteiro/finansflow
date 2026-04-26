/**
 * EditTransactionUseCase — regras de edição por tipo de transação
 *
 * PROBLEMA ATUAL:
 * O usecase antigo faz um único `transaction.update(newData)` sem
 * distinguir o tipo da transação. Isso causa dois bugs sérios:
 *
 * 1. Editar o valor de uma transação PARCELADA recalcula todos os
 *    payments pendentes usando `amount / installmentsCount`, mas se
 *    o usuário quer alterar só o valor de uma parcela específica
 *    (não todas), isso não é possível.
 *
 * 2. Editar uma transação FIXA substitui toda a transação, mas o
 *    correto seria poder alterar "só daqui pra frente" (como na deleção),
 *    pois meses já pagos têm um histórico imutável.
 *
 * SOLUÇÃO — EditScope:
 * Assim como a deleção tem TransactionRemovalScope (ALL, CURRENT_MONTH,
 * FROM_MONTH_ONWARD), a edição agora tem EditScope:
 *
 * - SINGLE:        Altera apenas os campos de texto/categoria/conta
 *                  (description, categoryId, accountId). Nunca toca
 *                  em amount nem em paymentHistory. Seguro para qualquer tipo.
 *
 * - AMOUNT_FORWARD: Altera o valor a partir do mês informado.
 *                  Para FIXED: atualiza amount + todos os payments
 *                  não pagos a partir daquele mês.
 *                  Para INSTALLMENT: atualiza o amount da parcela
 *                  específica (não redistribui todas).
 *                  Para SIMPLE: atualiza o amount e o único payment.
 *
 * - ALL:           Edição completa (description, amount, category...).
 *                  Recalcula TODOS os payments ainda não pagos.
 *                  Usar com cuidado — só faz sentido para SIMPLE ou
 *                  quando o usuário explicitamente quer mudar tudo.
 */

import { IRepository } from "@/domain/interfaces/repository/repository";
import { Transaction } from "@/domain/entities/transaction/Transaction";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";
import { IPaymentHistory } from "@/domain/interfaces/transaction/IPaymentHistory";
import { TransactionKind } from "@/domain/enums/transaction/TransactionKind";

// ── Escopo de edição ──────────────────────────────────────────────────────────
export enum EditScope {
  /**
   * Altera só campos descritivos: description, categoryId, accountId.
   * Nunca toca em amount nem paymentHistory.
   * É o escopo mais seguro — serve para QUALQUER tipo sem efeitos colaterais.
   */
  SINGLE = "single",

  /**
   * Altera o valor (amount) a partir de um mês específico.
   * - SIMPLE:       atualiza amount + o único payment.
   * - FIXED:        atualiza amount + todos os payments não pagos >= mês alvo.
   * - INSTALLMENT:  atualiza só o payment da parcela do mês alvo.
   */
  AMOUNT_FORWARD = "amount_forward",

  /**
   * Edição completa: description + amount + category + account.
   * Recalcula TODOS os payments não pagos com o novo amount.
   * Use para SIMPLE ou quando o usuário escolhe "alterar tudo".
   */
  ALL = "all",
}

// ── Payload de edição ─────────────────────────────────────────────────────────
export interface EditPayload {
  description?: string;
  categoryId?: string;
  accountId?: string;
  amount?: number;
  dueDate?: Date;
}

// ── UseCase ───────────────────────────────────────────────────────────────────
export class EditTransactionUseCase {
  constructor(
    private readonly transactionRepository: IRepository<Transaction>
  ) {}

  async execute(
    transactionId: string,
    payload: EditPayload,
    scope: EditScope,
    year?: number,
    month?: number
  ): Promise<Transaction> {
    // 1. Busca a transação original no banco
    const data = await this.transactionRepository.findById(transactionId);
    if (!data) throw new Error("Transação não encontrada");

    const tx = Transaction.fromData(data);

    // 2. Delega para o handler correto conforme escopo
    switch (scope) {
      case EditScope.SINGLE:
        return this.editSingle(tx, payload);

      case EditScope.AMOUNT_FORWARD:
        if (payload.amount === undefined) {
          throw new Error("amount é obrigatório para EditScope.AMOUNT_FORWARD");
        }
        if (!year || !month) {
          throw new Error(
            "year e month são obrigatórios para EditScope.AMOUNT_FORWARD"
          );
        }
        return this.editAmountForward(tx, payload, year, month);

      case EditScope.ALL:
        return this.editAll(tx, payload);

      default:
        throw new Error("EditScope inválido");
    }
  }

  // ── SINGLE: só campos descritivos ──────────────────────────────────────────
  /**
   * Por que separar isso?
   * Se o usuário quer corrigir uma categoria ou descrição errada, ele NÃO deve
   * ser obrigado a escolher se quer alterar "só este mês" ou "todos". Campos
   * de texto não têm histórico temporal — a categoria de uma despesa fixa de
   * aluguel é sempre "Moradia", independente do mês. Então editamos globalmente
   * sem tocar em amounts nem paymentHistory.
   */
  private async editSingle(
    tx: Transaction,
    payload: Pick<EditPayload, "description" | "categoryId" | "accountId">
  ): Promise<Transaction> {
    const updated = tx.update({
      description: payload.description ?? tx.description,
      categoryId: payload.categoryId ?? tx.categoryId,
      accountId: payload.accountId ?? tx.accountId,
    });

    return this.transactionRepository.update(tx.id, updated);
  }

  // ── AMOUNT_FORWARD: altera valor a partir de um mês ────────────────────────
  /**
   * Por que esse escopo existe?
   *
   * Imagine um aluguel fixo de R$1.000 que virou R$1.200 a partir de março.
   * O usuário não quer perder o histórico de jan/fev pagos a R$1.000.
   * Também não quer criar uma nova transação do zero.
   *
   * Com AMOUNT_FORWARD:
   * - Os payments JÁ PAGOS ficam com o valor original (imutáveis — são fatos).
   * - Os payments NÃO PAGOS a partir do mês alvo recebem o novo valor.
   * - O `amount` da transação (que é o valor "base") também é atualizado,
   *   pois é o valor usado para gerar novos payments futuros de FIXED.
   *
   * Para INSTALLMENT o comportamento é diferente:
   * Cada parcela já tem seu valor calculado. Alteramos só a parcela do mês
   * informado (o usuário pediu um desconto nessa parcela específica, por ex).
   * Para alterar todas as parcelas restantes, o usuário usaria EditScope.ALL.
   */
  private async editAmountForward(
    tx: Transaction,
    payload: EditPayload,
    year: number,
    month: number
  ): Promise<Transaction> {
    const newAmount = payload.amount!;

    let updatedPaymentHistory: IPaymentHistory[];

    if (tx.kind === TransactionKind.INSTALLMENT) {
      // Para parcelado, "a partir de X" significa: todos os payments
      // pendentes cujo dueDate >= o mês alvo recebem o novo valor.
      //
      // Por que não alteramos só o mês exato?
      // INSTALLMENT tem um número fixo de parcelas. Se o valor mudou
      // (ex: negociou desconto nas parcelas restantes), faz sentido
      // aplicar a partir dali — igual à semântica de FIXED.
      //
      // Nota: o `amount` da transação (total) também é atualizado para
      // refletir: parcelas já pagas × valor original + parcelas restantes
      // × novo valor. Isso mantém o total consistente.
      const targetDate = new Date(year, month - 1, 1);
      updatedPaymentHistory = tx.paymentHistory.map((p) => {
        const pDate = new Date(p.dueDate);
        if (!p.isPaid && pDate >= targetDate) {
          return { ...p, amount: newAmount };
        }
        return p;
      });

      // Recalcula o amount total da transação:
      // soma dos pagos (valor original) + soma dos pendentes (novo valor)
      const totalPaid = tx.paymentHistory
        .filter((p) => p.isPaid)
        .reduce((acc, p) => acc + p.amount, 0);
      const pendingCount = updatedPaymentHistory.filter(
        (p) => !p.isPaid
      ).length;
      const newTotal = totalPaid + pendingCount * newAmount;
      payload = { ...payload, amount: newTotal };
    } else {
      // Para FIXED e SIMPLE: atualiza todos os payments não pagos >= mês alvo
      const targetDate = new Date(year, month - 1, 1);
      updatedPaymentHistory = tx.paymentHistory.map((p) => {
        const pDate = new Date(p.dueDate);
        // Só atualiza se não foi pago E a data é >= o mês alvo
        if (!p.isPaid && pDate >= targetDate) {
          return { ...p, amount: newAmount };
        }
        return p;
      });
    }

    const updated = tx.update({
      amount: newAmount,
      description: payload.description ?? tx.description,
      categoryId: payload.categoryId ?? tx.categoryId,
      accountId: payload.accountId ?? tx.accountId,
      paymentHistory: updatedPaymentHistory,
    });

    return this.transactionRepository.update(tx.id, updated);
  }

  // ── ALL: edição completa ────────────────────────────────────────────────────
  /**
   * Por que ainda ter esse escopo?
   * Para transações SIMPLES faz sentido total — tem só um payment, não há
   * histórico para preservar.
   *
   * Para FIXED/INSTALLMENT, é o escopo "nuclear": o usuário está dizendo
   * "quero reescrever tudo a partir do início". Recalculamos todos os
   * payments não pagos com o novo amount. Os já pagos continuam intactos
   * (você não pode desdesfazer dinheiro que já saiu da conta).
   */
  private async editAll(
    tx: Transaction,
    payload: EditPayload
  ): Promise<Transaction> {
    const newAmount = payload.amount ?? tx.amount;
    const newDueDate = payload.dueDate;

    // Recalcula o valor unitário para cada tipo
    const unitAmount = this.calculateUnitAmount(tx, newAmount);

    // Atualiza payments: preserva os pagos, recalcula os pendentes
    const updatedPaymentHistory: IPaymentHistory[] = tx.paymentHistory.map(
      (p) => {
        if (p.isPaid) return p; // fato imutável
        // SIMPLE: atualiza também a dueDate do único payment
        if (tx.kind === TransactionKind.SIMPLE && newDueDate) {
          return { ...p, amount: unitAmount, dueDate: newDueDate };
        }
        return { ...p, amount: unitAmount };
      }
    );

    const updated = tx.update({
      amount: newAmount,
      description: payload.description ?? tx.description,
      categoryId: payload.categoryId ?? tx.categoryId,
      accountId: payload.accountId ?? tx.accountId,
      paymentHistory: updatedPaymentHistory,
      // SIMPLE e FIXED: atualiza a dueDate base. INSTALLMENT: não toca.
      ...(newDueDate && tx.kind !== TransactionKind.INSTALLMENT
        ? { dueDate: newDueDate }
        : {}),
    });

    return this.transactionRepository.update(tx.id, updated);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  /**
   * Para INSTALLMENT: o amount da transação é o total, cada payment
   * guarda o valor da parcela (total / installmentsCount).
   * Para FIXED e SIMPLE: o amount é o valor unitário de cada ocorrência.
   */
  private calculateUnitAmount(tx: Transaction, newTotalAmount: number): number {
    if (
      tx.kind === TransactionKind.INSTALLMENT &&
      tx.recurrence.installmentsCount
    ) {
      return newTotalAmount / tx.recurrence.installmentsCount;
    }
    return newTotalAmount;
  }
}
