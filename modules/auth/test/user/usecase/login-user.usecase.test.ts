import { DomainError, ValidationException } from "@sdd/shared";
import { User } from "../../../src/user/model";
import { LoginUser } from "../../../src/user/usecase";
import { FakeCryptoProvider, FakeUserRepository } from "../../mock";

const FAKE_HASH = "$2b$10$abcdefghijklmnopqrstuvwxABCDEFGHIJKLMNOPQRSTUVWX01234";

const REGISTERED_USER = new User({
  name: "Maria Silva",
  email: "maria@example.com",
  password: FAKE_HASH,
});

const VALID_INPUT = {
  email: "maria@example.com",
  password: "anything-non-empty",
};

function makeUseCase() {
  const userRepository = new FakeUserRepository();
  userRepository.users.push(REGISTERED_USER);
  const cryptoProvider = new FakeCryptoProvider();
  return { useCase: new LoginUser(userRepository, cryptoProvider), userRepository, cryptoProvider };
}

describe("LoginUser", () => {
  it("should return { id, name, email } without password on valid credentials", async () => {
    const { useCase } = makeUseCase();

    const result = await useCase.execute(VALID_INPUT);

    expect(result).toEqual({
      id: REGISTERED_USER.id,
      name: REGISTERED_USER.name,
      email: REGISTERED_USER.email,
    });
    expect(result).not.toHaveProperty("password");
  });

  it("should throw DomainError 401 when email is not registered", async () => {
    const { useCase } = makeUseCase();

    const error = await useCase
      .execute({ ...VALID_INPUT, email: "unknown@example.com" })
      .catch((e) => e);

    expect(error).toBeInstanceOf(DomainError);
    expect((error as DomainError).statusCode).toBe(401);
    expect((error as DomainError).message).toBe("user.credentials.invalid");
  });

  it("should throw DomainError 401 when password is wrong", async () => {
    const { useCase } = makeUseCase();

    // FakeCryptoProvider.comparePassword returns false when hash doesn't match
    const error = await useCase
      .execute({ ...VALID_INPUT, email: "maria@example.com", password: "" })
      .catch((e) => e);

    // empty password triggers RequiredRule first
    expect(error).toBeInstanceOf(ValidationException);
  });

  it("should throw DomainError 401 when password is incorrect (non-empty, wrong)", async () => {
    const userRepository = new FakeUserRepository();
    userRepository.users.push(REGISTERED_USER);
    // Override comparePassword to return false
    const cryptoProvider = new FakeCryptoProvider();
    jest.spyOn(cryptoProvider, "comparePassword").mockResolvedValue(false);
    const useCase = new LoginUser(userRepository, cryptoProvider);

    const error = await useCase
      .execute({ email: "maria@example.com", password: "WrongPass1" })
      .catch((e) => e);

    expect(error).toBeInstanceOf(DomainError);
    expect((error as DomainError).statusCode).toBe(401);
    expect((error as DomainError).message).toBe("user.credentials.invalid");
  });

  it("should throw ValidationException when email is empty", async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({ ...VALID_INPUT, email: "" }),
    ).rejects.toThrow(ValidationException);
  });

  it("should throw ValidationException when email is invalid", async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({ ...VALID_INPUT, email: "not-an-email" }),
    ).rejects.toThrow(ValidationException);
  });

  it("should throw ValidationException when password is empty", async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({ ...VALID_INPUT, password: "" }),
    ).rejects.toThrow(ValidationException);
  });

  it("should use the same error message for missing user and wrong password (no email enumeration)", async () => {
    const { useCase } = makeUseCase();
    const cryptoProvider2 = new FakeCryptoProvider();
    jest.spyOn(cryptoProvider2, "comparePassword").mockResolvedValue(false);
    const useCase2 = new LoginUser(new FakeUserRepository(), cryptoProvider2);
    // Add user so we can check same message
    const repo2 = new FakeUserRepository();
    repo2.users.push(REGISTERED_USER);
    const useCase3 = new LoginUser(repo2, cryptoProvider2);

    const errMissingUser = await useCase
      .execute({ ...VALID_INPUT, email: "ghost@example.com" })
      .catch((e: DomainError) => e);

    const errWrongPassword = await useCase3
      .execute(VALID_INPUT)
      .catch((e: DomainError) => e);

    expect(errMissingUser.message).toBe(errWrongPassword.message);
  });
});
