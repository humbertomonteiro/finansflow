export interface IRepository<T> {
  save(data: T): Promise<T>;
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  update(id: string, data: T): Promise<T>;
  delete(id: string): Promise<void>;
  findByEmail?(email: string): Promise<T | null>;
  getTransactionsForAccount?(accountId: string): Promise<T[]>;
}
