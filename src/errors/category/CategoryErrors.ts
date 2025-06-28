export class InvalidCategoryNameError extends Error {
  constructor(message?: string) {
    super(message || "Category name must be a non-empty string");
    this.name = "InvalidCategoryNameError";
  }
}
