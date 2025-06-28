export class InvalidBalanceError extends Error {
  constructor(message?: string) {
    super(message || "Balance must be greater than 0");
    this.name = "InvalidBalanceError";
  }
}

export class InvalidTransactionAccountError extends Error {
  constructor(message?: string) {
    super(message || "Transaction does not belong to this account");
    this.name = "InvalidTransactionAccountError";
  }
}

export class InvalidAccountNameError extends Error {
  constructor(message?: string) {
    super(message || "Account name must be at least 3 characters long");
    this.name = "InvalidAccountNameError";
  }
}
