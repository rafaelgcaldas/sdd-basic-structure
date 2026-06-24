import { RequiredRule, UseCase, Validator } from "@sdd/shared";
import { User } from "../model";
import { CryptoProvider, UserRepository } from "../provider";

export interface SaveUserIn {
  id?: string;
  name: string;
  email: string;
  password?: string;
}

export class SaveUser implements UseCase<SaveUserIn, void> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cryptoProvider: CryptoProvider,
  ) {}

  async execute(input: SaveUserIn): Promise<void> {
    Validator.validate([
      {
        code: "user.name",
        value: input.name,
        rules: [new RequiredRule()],
      },
      {
        code: "user.email",
        value: input.email,
        rules: [new RequiredRule()],
      },
    ]);

    const existing = input.id
      ? await this.userRepository.findById(input.id)
      : null;

    if (existing) {
      const hashedPassword =
        input.password && input.password.trim().length > 0
          ? await this.cryptoProvider.hashPassword(input.password)
          : existing.password;

      const updated = new User({
        id: existing.id,
        name: input.name,
        email: input.email,
        password: hashedPassword,
        createdAt: existing.createdAt,
      });

      updated.validate();
      await this.userRepository.update(updated);
    } else {
      Validator.validate([
        {
          code: "user.password",
          value: input.password,
          rules: [new RequiredRule()],
        },
      ]);

      const hashedPassword = await this.cryptoProvider.hashPassword(
        input.password!,
      );

      const user = new User({
        id: input.id,
        name: input.name,
        email: input.email,
        password: hashedPassword,
      });

      user.validate();
      await this.userRepository.create(user);
    }
  }
}
