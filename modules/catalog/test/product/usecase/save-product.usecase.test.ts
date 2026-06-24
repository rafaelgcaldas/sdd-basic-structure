import { ValidationException } from "@sdd/shared";
import { Product } from "../../../src/product/model";
import { SaveProduct, SaveProductIn } from "../../../src/product/usecase/save-product.usecase";
import { FakeProductRepository } from "../../mock";

const UUID_1 = "550e8400-e29b-41d4-a716-446655440001";
const UUID_2 = "550e8400-e29b-41d4-a716-446655440002";
const UUID_3 = "550e8400-e29b-41d4-a716-446655440003";

function makeValidInput(overrides: Partial<SaveProductIn> = {}): SaveProductIn {
  return {
    name: "Produto Teste",
    description: null,
    price: 10.99,
    status: "active",
    availableOnline: false,
    featured: false,
    allowsPreOrder: false,
    ...overrides,
  };
}

function makeExistingProduct(id: string): Product {
  return new Product({
    id,
    name: "Produto Existente",
    description: null,
    price: 5.0,
    status: "draft",
    availableOnline: false,
    featured: false,
    allowsPreOrder: false,
  });
}

describe("SaveProduct use case", () => {
  describe("creation (no id or id not found)", () => {
    it("should create a new product when no id is provided", async () => {
      const repo = new FakeProductRepository();
      const useCase = new SaveProduct(repo);

      await useCase.execute(makeValidInput());

      expect(repo.products).toHaveLength(1);
      expect(repo.products[0].name).toBe("Produto Teste");
    });

    it("should create with a new id when none is provided", async () => {
      const repo = new FakeProductRepository();
      const useCase = new SaveProduct(repo);

      await useCase.execute(makeValidInput());

      expect(repo.products[0].id).toBeDefined();
    });

    it("should use provided id when id is given but product not found", async () => {
      const repo = new FakeProductRepository();
      const useCase = new SaveProduct(repo);

      await useCase.execute(makeValidInput({ id: UUID_1 }));

      expect(repo.products[0].id).toBe(UUID_1);
    });

    it("should default availableOnline, featured, allowsPreOrder to false", async () => {
      const repo = new FakeProductRepository();
      const useCase = new SaveProduct(repo);

      await useCase.execute({
        name: "Produto Teste",
        price: 10.0,
        status: "active",
      });

      const product = repo.products[0];
      expect(product.availableOnline).toBe(false);
      expect(product.featured).toBe(false);
      expect(product.allowsPreOrder).toBe(false);
    });

    it("should throw ValidationException for invalid product data", async () => {
      const repo = new FakeProductRepository();
      const useCase = new SaveProduct(repo);

      await expect(
        useCase.execute(makeValidInput({ name: "" })),
      ).rejects.toBeInstanceOf(ValidationException);
    });

    it("should throw for negative price", async () => {
      const repo = new FakeProductRepository();
      const useCase = new SaveProduct(repo);

      await expect(
        useCase.execute(makeValidInput({ price: -1 })),
      ).rejects.toBeInstanceOf(ValidationException);
    });

    it("should not create product when validation fails", async () => {
      const repo = new FakeProductRepository();
      const useCase = new SaveProduct(repo);

      await expect(
        useCase.execute(makeValidInput({ name: "" })),
      ).rejects.toThrow();
      expect(repo.products).toHaveLength(0);
    });
  });

  describe("update (id provided and product found)", () => {
    it("should update existing product when id matches", async () => {
      const existing = makeExistingProduct(UUID_1);
      const repo = new FakeProductRepository([existing]);
      const useCase = new SaveProduct(repo);

      await useCase.execute(
        makeValidInput({ id: UUID_1, name: "Produto Atualizado", status: "active" }),
      );

      expect(repo.products[0].name).toBe("Produto Atualizado");
      expect(repo.products[0].status).toBe("active");
    });

    it("should preserve existing boolean flags when not provided in update", async () => {
      const existing = new Product({
        id: UUID_2,
        name: "Produto",
        description: null,
        price: 5.0,
        status: "active",
        availableOnline: true,
        featured: true,
        allowsPreOrder: true,
      });
      const repo = new FakeProductRepository([existing]);
      const useCase = new SaveProduct(repo);

      await useCase.execute({
        id: UUID_2,
        name: "Produto Atualizado",
        price: 10.0,
        status: "active",
      });

      const updated = repo.products[0];
      expect(updated.availableOnline).toBe(true);
      expect(updated.featured).toBe(true);
      expect(updated.allowsPreOrder).toBe(true);
    });

    it("should not increase product count on update", async () => {
      const existing = makeExistingProduct(UUID_3);
      const repo = new FakeProductRepository([existing]);
      const useCase = new SaveProduct(repo);

      await useCase.execute(makeValidInput({ id: UUID_3 }));

      expect(repo.products).toHaveLength(1);
    });

    it("should throw ValidationException for invalid update data", async () => {
      const existing = makeExistingProduct(UUID_1);
      const repo = new FakeProductRepository([existing]);
      const useCase = new SaveProduct(repo);

      await expect(
        useCase.execute(makeValidInput({ id: UUID_1, name: "" })),
      ).rejects.toBeInstanceOf(ValidationException);
    });
  });
});
