import { TransactionTypes } from "@/domain/enums/transaction/TransactionTypes";
import { IAccount } from "@/domain/interfaces/account/IAccount";
import { ITransaction } from "@/domain/interfaces/transaction/ITransaction";

export interface AccountDiagnostic {
  accountId: string;
  accountName: string;
  storedBalance: number;
  calculatedBalance: number;
  difference: number;
}

export class BalanceDiagnosticUsecase {
  execute(accounts: IAccount[], transactions: ITransaction[]): AccountDiagnostic[] {
    return accounts.map((account) => {
      let calculated = 0;

      for (const t of transactions) {
        for (const p of t.paymentHistory) {
          if (!p.isPaid) continue;
          const effectiveAccountId = p.paidAccountId ?? t.accountId;
          if (effectiveAccountId !== account.id) continue;

          if (t.type === TransactionTypes.DEPOSIT) {
            calculated += p.amount;
          } else if (t.type === TransactionTypes.WITHDRAW) {
            calculated -= p.amount;
          }
        }
      }

      return {
        accountId: account.id,
        accountName: account.name,
        storedBalance: account.balance,
        calculatedBalance: calculated,
        difference: account.balance - calculated,
      };
    });
  }
}
