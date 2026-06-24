import { DomainError } from "@sdd/shared";
import { Product } from "../../../src/product/model";
import { DeleteProduct } from "../../../src/product/usecase/delete-product.usecase";
import { FakeProductRepository } from "../../mock";

const UUID_1 = "550e8400-e29b-41d4-a716-446655440001";
const UUID_2 = "550e8400-e29b-41d4-a716-446655440002";

function makeProduct(id: string): Product {
  return new Product({
    id,
    name: "Produto Teste",
    description: null,
    price: 10.0,
    status: "active",
    availableOnline: false,
    featured: false,
    allowsPreOrder: false,
  });
}

describe("DeleteProduct use case", () => {
  it("should delete an existing product", async () => {
    const repo = new FakeProductRepository([makeProduct(UUID_1)]);
    const useCase = new DeleteProduct(repo);

    await useCase.execute({ id: UUID_1 });

    expect(repo.products).toHaveLength(0);
  });

  it("should throw DomainError with product.not_found when id does not exist", async () => {
    const repo = new FakeProductRepository();
    const useCase = new DeleteProduct(repo);

    await expect(
      useCase.execute({ id: UUID_1 }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("should throw DomainError with code product.not_found and status 404", async () => {
    const repo = new FakeProductRepository();
    const useCase = new DeleteProduct(repo);

    let caughtError: DomainError | null = null;
    try {
      await useCase.execute({ id: UUID_1 });
    } catch (error) {
      caughtError = error as DomainError;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError!.message).toBe("product.not_found");
    expect(caughtError!.statusCode).toBe(404);
  });

  it("should not affect other products when deleting one", async () => {
    const repo = new FakeProductRepository([makeProduct(UUID_1), makeProduct(UUID_2)]);
    const useCase = new DeleteProduct(repo);

    await useCase.execute({ id: UUID_1 });

    expect(repo.products).toHaveLength(1);
    expect(repo.products[0].id).toBe(UUID_2);
  });
});
