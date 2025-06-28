// import { GetFutureBalanceByUserUsecase } from "@/domain/usecases/account/GetBalanceUsecase";
// import { ListAccountByUserUsecase } from "@/domain/usecases/account/ListAccountByUserUsecase";
// import { ListTransactionsByUserAndDateUsecase } from "@/domain/usecases/transaction/ListTransactionsByUserAndDateUsecase";

// import { UserRepositoryFirestore } from "@/infra/repositories/FirebaseUserRepository";
// import { AccountRepositoryFirestore } from "@/infra/repositories/FirebaseAccountRepository";
// import { TransactionRepositoryFirestore } from "@/infra/repositories/FirebaseTransactionRepository";

// export const metricsByUserController = async (
//   userId: string,
//   month: number,
//   year: number
// ) => {
//   try {
//     const accountRepository = new AccountRepositoryFirestore();
//     const userRepository = new UserRepositoryFirestore();
//     const transactionRepository = new TransactionRepositoryFirestore();

//     const listAccountByUserUsecase = new ListAccountByUserUsecase(
//       accountRepository,
//       userRepository
//     );
//     const listTransactionsByUserAndDateUsecase =
//       new ListTransactionsByUserAndDateUsecase(
//         userRepository,
//         accountRepository,
//         transactionRepository
//       );
//     const getFutureBalanceByUserUsecase = new GetFutureBalanceByUserUsecase(
//       listAccountByUserUsecase,
//       listTransactionsByUserAndDateUsecase
//     );
//     const metrics = await getFutureBalanceByUserUsecase.execute(
//       userId,
//       month,
//       year
//     );
//     return metrics;
//   } catch (error) {
//     throw new Error("Error fetching metrics by user");
//   }
// };
