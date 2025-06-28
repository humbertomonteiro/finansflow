export class InvalidAmountError extends Error {
  constructor() {
    super("Amount must be greater than 0");
    this.name = "InvalidAmountError";
  }
}

export class InvalidTransactionTypeError extends Error {
  constructor() {
    super("Invalid transaction type");
    this.name = "InvalidTransactionTypeError";
  }
}

export class InvalidTransactionKindError extends Error {
  constructor() {
    super("Invalid transaction kind");
    this.name = "InvalidTransactionKindError";
  }
}

export class InvalidInstallmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInstallmentError";
  }
}
