import { User } from "../../../src/user/model";
import { DeleteUser } from "../../../src/user/usecase";
import { FakeUserRepository } from "../../mock";

const FAKE_HASH =
  "$2b$10$abcdefghijklmnopqrstuvwxABCDEFGHIJKLMNOPQRSTUVWX01234";

const USER_ID_1 = "0a3863bb-2622-43b0-a34a-a6d771100f55";
const USER_ID_2 = "bab7fbf5-447c-4f69-ad9e-7d653308a6a1";
const MISSING_ID = "3aa02b92-7199-4c27-a0d1-0c1a2fee1184";

function makeUser(id: string, name: string, email: string): User {
  return new User({ id, name, email, password: FAKE_HASH });
}

describe("DeleteUser", () => {
  it("deve excluir o usuário quando ele existir", async () => {
    const user = makeUser(USER_ID_1, "Ana Lima", "ana@example.com");
    const userRepository = new FakeUserRepository([user]);
    const useCase = new DeleteUser(userRepository);

    await expect(useCase.execute({ id: user.id })).resolves.toBeUndefined();
    await expect(userRepository.findById(user.id)).resolves.toBeNull();
    expect(userRepository.users).toHaveLength(0);
  });

  it("deve continuar previsível mesmo quando o id não existir", async () => {
    const userRepository = new FakeUserRepository();
    const useCase = new DeleteUser(userRepository);

    await expect(
      useCase.execute({ id: MISSING_ID }),
    ).resolves.toBeUndefined();
    expect(userRepository.users).toEqual([]);
  });

  it("deve excluir apenas o usuário alvo quando houver múltiplos usuários", async () => {
    const user1 = makeUser(USER_ID_1, "Ana Lima", "ana@example.com");
    const user2 = makeUser(USER_ID_2, "Carlos Mendes", "carlos@example.com");
    const userRepository = new FakeUserRepository([user1, user2]);
    const useCase = new DeleteUser(userRepository);

    await useCase.execute({ id: user1.id });

    expect(userRepository.users).toHaveLength(1);
    expect(userRepository.users[0].id).toBe(user2.id);
  });
});
