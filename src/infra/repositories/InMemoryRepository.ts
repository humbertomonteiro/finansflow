import { IRepository } from "../../domain/interfaces/repository/repository";

export class InMemoryRepository<T> implements IRepository<T> {
  private readonly data: T[] = [];

  async save(data: T): Promise<void> {
    this.data.push(data);
  }

  async findAll(): Promise<T[]> {
    return this.data;
  }

  async findById(id: string): Promise<T | null> {
    return this.data.find((item) => (item as any).id === id) || null;
  }

  async update(id: string, data: T): Promise<void> {
    const index = this.data.findIndex((item) => (item as any).id === id);
    if (index === -1) {
      throw new Error("Item not found");
    }
    this.data[index] = data;
  }

  async delete(id: string): Promise<void> {
    const index = this.data.findIndex((item) => (item as any).id === id);
    if (index === -1) {
      throw new Error("Item not found");
    }
    this.data.splice(index, 1);
  }

  async findByEmail(email: string): Promise<T | null> {
    return this.data.find((item) => (item as any).email === email) || null;
  }
}
