import { ValidationException } from "@sdd/shared";
import { User } from "../../../src/user/model";
import { SaveUser } from "../../../src/user/usecase";
import { FakeCryptoProvider, FakeUserRepository } from "../../mock";

const FAKE_HASH =
  "$2b$10$abcdefghijklmnopqrstuvwxABCDEFGHIJKLMNOPQRSTUVWX01234";

const USER_ID = "4c77ab9e-94a8-4be8-a589-31294bd27967";

const VALID_CREATE_INPUT = {
  name: "João Silva",
  email: "joao@example.com",
  password: "Secret@Pass1",
};

describe("SaveUser", () => {
  describe("criação (sem id ou id não encontrado)", () => {
    it("deve criar o usuário com senha hasheada no caminho feliz", async () => {
      const userRepository = new FakeUserRepository();
      const cryptoProvider = new FakeCryptoProvider();
      const useCase = new SaveUser(userRepository, cryptoProvider);
      const validateSpy = jest.spyOn(User.prototype, "validate");

      await expect(
        useCase.execute(VALID_CREATE_INPUT),
      ).resolves.toBeUndefined();

      expect(cryptoProvider.hashedPasswords).toEqual([
        VALID_CREATE_INPUT.password,
      ]);
      expect(validateSpy).toHaveBeenCalledTimes(1);
      expect(userRepository.users).toHaveLength(1);
      expect(userRepository.users[0].name).toBe(VALID_CREATE_INPUT.name);
      expect(userRepository.users[0].email).toBe(VALID_CREATE_INPUT.email);
      expect(userRepository.users[0].password).toBe(FAKE_HASH);

      validateSpy.mockRestore();
    });

    it("deve criar usuário com id informado quando id não existir no repositório", async () => {
      const userRepository = new FakeUserRepository();
      const cryptoProvider = new FakeCryptoProvider();
      const useCase = new SaveUser(userRepository, cryptoProvider);

      await useCase.execute({ ...VALID_CREATE_INPUT, id: USER_ID });

      expect(userRepository.users[0].id).toBe(USER_ID);
    });

    it("deve lançar ValidationException quando name está vazio", async () => {
      const useCase = new SaveUser(
        new FakeUserRepository(),
        new FakeCryptoProvider(),
      );

      await expect(
        useCase.execute({ ...VALID_CREATE_INPUT, name: "" }),
      ).rejects.toThrow(ValidationException);
    });

    it("deve lançar ValidationException quando email está vazio", async () => {
      const useCase = new SaveUser(
        new FakeUserRepository(),
        new FakeCryptoProvider(),
      );

      await expect(
        useCase.execute({ ...VALID_CREATE_INPUT, email: "" }),
      ).rejects.toThrow(ValidationException);
    });

    it("deve lançar ValidationException quando password está ausente na criação", async () => {
      const useCase = new SaveUser(
        new FakeUserRepository(),
        new FakeCryptoProvider(),
      );

      await expect(
        useCase.execute({ name: "João Silva", email: "joao@example.com" }),
      ).rejects.toThrow(ValidationException);
    });

    it("não deve chamar repositório quando validação de nome falhar", async () => {
      const userRepository = new FakeUserRepository();
      const cryptoProvider = new FakeCryptoProvider();
      const useCase = new SaveUser(userRepository, cryptoProvider);

      await expect(
        useCase.execute({ ...VALID_CREATE_INPUT, name: "" }),
      ).rejects.toThrow(ValidationException);

      expect(cryptoProvider.hashedPasswords).toHaveLength(0);
      expect(userRepository.users).toHaveLength(0);
    });
  });

  describe("atualização (id encontrado no repositório)", () => {
    function makeExistingUser(): User {
      return new User({
        id: USER_ID,
        name: "Maria Souza",
        email: "maria@example.com",
        password: FAKE_HASH,
      });
    }

    it("deve atualizar nome e email mantendo hash existente quando password não fornecida", async () => {
      const existingUser = makeExistingUser();
      const userRepository = new FakeUserRepository([existingUser]);
      const cryptoProvider = new FakeCryptoProvider();
      const useCase = new SaveUser(userRepository, cryptoProvider);

      await expect(
        useCase.execute({
          id: existingUser.id,
          name: "Maria Renovada",
          email: "nova@example.com",
        }),
      ).resolves.toBeUndefined();

      expect(cryptoProvider.hashedPasswords).toHaveLength(0);
      expect(userRepository.users[0].name).toBe("Maria Renovada");
      expect(userRepository.users[0].email).toBe("nova@example.com");
      expect(userRepository.users[0].password).toBe(FAKE_HASH);
    });

    it("deve atualizar senha quando password não estiver vazia", async () => {
      const existingUser = makeExistingUser();
      const userRepository = new FakeUserRepository([existingUser]);
      const cryptoProvider = new FakeCryptoProvider();
      const useCase = new SaveUser(userRepository, cryptoProvider);

      await useCase.execute({
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        password: "NewSecret@Pass1",
      });

      expect(cryptoProvider.hashedPasswords).toEqual(["NewSecret@Pass1"]);
      expect(userRepository.users[0].password).toBe(FAKE_HASH);
    });

    it("deve manter hash atual quando password for string vazia", async () => {
      const existingUser = makeExistingUser();
      const userRepository = new FakeUserRepository([existingUser]);
      const cryptoProvider = new FakeCryptoProvider();
      const useCase = new SaveUser(userRepository, cryptoProvider);

      await useCase.execute({
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        password: "",
      });

      expect(cryptoProvider.hashedPasswords).toHaveLength(0);
      expect(userRepository.users[0].password).toBe(FAKE_HASH);
    });

    it("deve lançar ValidationException quando name está vazio na atualização", async () => {
      const existingUser = makeExistingUser();
      const userRepository = new FakeUserRepository([existingUser]);
      const useCase = new SaveUser(userRepository, new FakeCryptoProvider());

      await expect(
        useCase.execute({ id: existingUser.id, name: "", email: "x@x.com" }),
      ).rejects.toThrow(ValidationException);
    });

    it("não deve chamar repositório quando validação falhar na atualização", async () => {
      const existingUser = makeExistingUser();
      const userRepository = new FakeUserRepository([existingUser]);
      const cryptoProvider = new FakeCryptoProvider();
      const useCase = new SaveUser(userRepository, cryptoProvider);

      await expect(
        useCase.execute({ id: existingUser.id, name: "", email: "x@x.com" }),
      ).rejects.toThrow(ValidationException);

      expect(cryptoProvider.hashedPasswords).toHaveLength(0);
      expect(userRepository.users[0].name).toBe(existingUser.name);
    });
  });
});
