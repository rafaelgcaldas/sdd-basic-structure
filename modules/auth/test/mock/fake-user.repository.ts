import { User } from "../../src/user/model";
import { UserPageParams, UserRepository } from "../../src/user/provider";

export class FakeUserRepository implements UserRepository {
  readonly users: User[];

  constructor(initialUsers: User[] = []) {
    this.users = [...initialUsers];
  }

  async create(user: User): Promise<User> {
    this.users.push(user);
    return user;
  }

  async update(user: User): Promise<User> {
    const index = this.users.findIndex((u) => u.id === user.id);
    if (index !== -1) {
      this.users[index] = user;
    }
    return user;
  }

  async delete(id: string): Promise<void> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
    }
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async findPage(
    _params: UserPageParams,
  ): Promise<{ data: User[]; total: number }> {
    return { data: this.users, total: this.users.length };
  }
}
