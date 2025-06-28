export class InvalidNameError extends Error {
  constructor(message?: string) {
    super(message || "Name is required");
    this.name = "InvalidNameError";
  }
}

export class InvalidEmailError extends Error {
  constructor(message?: string) {
    super(message || "Email is required");
    this.name = "InvalidEmailError";
  }
}

export class InvalidPasswordError extends Error {
  constructor(message?: string) {
    super(message || "Password is required");
    this.name = "InvalidPasswordError";
  }
}
