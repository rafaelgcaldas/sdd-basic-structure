import { DomainError, ValidationException } from "@sdd/shared";
import { User } from "../../../src/user/model";
import { RegisterUser } from "../../../src/user/usecase";
import { FakeCryptoProvider, FakeUserRepository } from "../../mock";

const VALID_INPUT = {
  name: "Maria Silva",
  email: "maria@example.com",
  password: "Strong@Pass1",
};

describe("RegisterUser", () => {
  it("should hash the password, create and persist the user on happy path", async () => {
    const userRepository = new FakeUserRepository();
    const cryptoProvider = new FakeCryptoProvider();
    const validateSpy = jest.spyOn(User.prototype, "validate");
    const useCase = new RegisterUser(userRepository, cryptoProvider);

    await expect(useCase.execute(VALID_INPUT)).resolves.toBeUndefined();

    expect(cryptoProvider.hashedPasswords).toEqual([VALID_INPUT.password]);
    expect(validateSpy).toHaveBeenCalledTimes(1);
    expect(userRepository.users).toHaveLength(1);
    expect(userRepository.users[0].email).toBe(VALID_INPUT.email);
    expect(userRepository.users[0].name).toBe(VALID_INPUT.name);

    validateSpy.mockRestore();
  });

  it("should throw ValidationException when name is empty", async () => {
    const useCase = new RegisterUser(
      new FakeUserRepository(),
      new FakeCryptoProvider(),
    );

    await expect(
      useCase.execute({ ...VALID_INPUT, name: "" }),
    ).rejects.toThrow(ValidationException);
  });

  it("should throw ValidationException when email is empty", async () => {
    const useCase = new RegisterUser(
      new FakeUserRepository(),
      new FakeCryptoProvider(),
    );

    await expect(
      useCase.execute({ ...VALID_INPUT, email: "" }),
    ).rejects.toThrow(ValidationException);
  });

  it("should throw ValidationException when password is weak", async () => {
    const useCase = new RegisterUser(
      new FakeUserRepository(),
      new FakeCryptoProvider(),
    );

    await expect(
      useCase.execute({ ...VALID_INPUT, password: "123456" }),
    ).rejects.toThrow(ValidationException);
  });

  it("should throw ValidationException when password is empty", async () => {
    const useCase = new RegisterUser(
      new FakeUserRepository(),
      new FakeCryptoProvider(),
    );

    await expect(
      useCase.execute({ ...VALID_INPUT, password: "" }),
    ).rejects.toThrow(ValidationException);
  });

  it("should not call repository when validation fails", async () => {
    const userRepository = new FakeUserRepository();
    const cryptoProvider = new FakeCryptoProvider();
    const useCase = new RegisterUser(userRepository, cryptoProvider);

    await expect(
      useCase.execute({ ...VALID_INPUT, password: "weak" }),
    ).rejects.toThrow(ValidationException);

    expect(cryptoProvider.hashedPasswords).toHaveLength(0);
    expect(userRepository.users).toHaveLength(0);
  });

  it("should throw DomainError with 409 when user email is already registered", async () => {
    const userRepository = new FakeUserRepository();
    const cryptoProvider = new FakeCryptoProvider();
    const useCase = new RegisterUser(userRepository, cryptoProvider);

    await useCase.execute(VALID_INPUT);

    const error = await useCase
      .execute(VALID_INPUT)
      .catch((e: DomainError) => e);

    expect(error).toBeInstanceOf(DomainError);
    expect((error as DomainError).statusCode).toBe(409);
    expect(userRepository.users).toHaveLength(1);
  });

  it("should not hash password when user already exists", async () => {
    const userRepository = new FakeUserRepository();
    const cryptoProvider = new FakeCryptoProvider();
    const useCase = new RegisterUser(userRepository, cryptoProvider);

    await useCase.execute(VALID_INPUT);
    const initialHashCount = cryptoProvider.hashedPasswords.length;

    await expect(useCase.execute(VALID_INPUT)).rejects.toThrow(DomainError);
    expect(cryptoProvider.hashedPasswords).toHaveLength(initialHashCount);
  });
});
