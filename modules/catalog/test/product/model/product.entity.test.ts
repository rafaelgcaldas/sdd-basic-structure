import { ValidationException } from "@sdd/shared";
import {
  Product,
  ProductState,
  ProductStatus,
} from "../../../src/product/model/product.entity";

function getValidationMessages(callback: () => void): string[] {
  try {
    callback();
    return [];
  } catch (error) {
    return (error as ValidationException).errors.map((item) => item.message);
  }
}

function makeValidProps(overrides: Partial<ProductState> = {}): ProductState {
  return {
    name: "Produto Teste",
    description: null,
    price: 10.99,
    status: "active" as ProductStatus,
    availableOnline: false,
    featured: false,
    allowsPreOrder: false,
    ...overrides,
  };
}

describe("Product entity", () => {
  describe("construction", () => {
    it("should create a valid product with generated id and timestamps", () => {
      const product = new Product(makeValidProps());

      expect(product.id).toBeDefined();
      expect(product.createdAt).toBeInstanceOf(Date);
      expect(product.updatedAt).toBeInstanceOf(Date);
      expect(product.deletedAt).toBeNull();
    });

    it("should preserve provided id", () => {
      const id = "550e8400-e29b-41d4-a716-446655440000";
      const product = new Product(makeValidProps({ id }));
      expect(product.id).toBe(id);
    });

    it("should preserve provided timestamps", () => {
      const createdAt = new Date("2024-01-01T00:00:00Z");
      const updatedAt = new Date("2024-01-02T00:00:00Z");
      const product = new Product(makeValidProps({ createdAt, updatedAt }));
      expect(product.createdAt).toEqual(createdAt);
      expect(product.updatedAt).toEqual(updatedAt);
    });

    it("should set deletedAt when provided", () => {
      const deletedAt = new Date("2024-06-01T00:00:00Z");
      const product = new Product(makeValidProps({ deletedAt }));
      expect(product.deletedAt).toEqual(deletedAt);
    });

    it("should not throw during construction even with invalid data", () => {
      expect(() => new Product(makeValidProps({ name: "" }))).not.toThrow();
      expect(
        () => new Product(makeValidProps({ price: -1 })),
      ).not.toThrow();
    });
  });

  describe("getters", () => {
    it("should return correct name", () => {
      const product = new Product(makeValidProps({ name: "Notebook Pro" }));
      expect(product.name).toBe("Notebook Pro");
    });

    it("should return correct description", () => {
      const product = new Product(
        makeValidProps({ description: "Uma descrição válida" }),
      );
      expect(product.description).toBe("Uma descrição válida");
    });

    it("should return null for description when not provided", () => {
      const product = new Product(makeValidProps({ description: null }));
      expect(product.description).toBeNull();
    });

    it("should return correct price", () => {
      const product = new Product(makeValidProps({ price: 49.99 }));
      expect(product.price).toBe(49.99);
    });

    it("should return correct status", () => {
      const product = new Product(makeValidProps({ status: "inactive" }));
      expect(product.status).toBe("inactive");
    });

    it("should return correct availableOnline", () => {
      const product = new Product(makeValidProps({ availableOnline: true }));
      expect(product.availableOnline).toBe(true);
    });

    it("should return correct featured", () => {
      const product = new Product(makeValidProps({ featured: true }));
      expect(product.featured).toBe(true);
    });

    it("should return correct allowsPreOrder", () => {
      const product = new Product(makeValidProps({ allowsPreOrder: true }));
      expect(product.allowsPreOrder).toBe(true);
    });
  });

  describe("validate()", () => {
    it("should not throw for valid data", () => {
      const product = new Product(makeValidProps());
      expect(() => product.validate()).not.toThrow();
    });

    it("should not throw for valid data with description", () => {
      const product = new Product(
        makeValidProps({ description: "Uma boa descrição do produto." }),
      );
      expect(() => product.validate()).not.toThrow();
    });

    describe("name", () => {
      it("should fail when name is empty", () => {
        const product = new Product(makeValidProps({ name: "" }));
        const messages = getValidationMessages(() => product.validate());
        expect(messages).toContain("product.name.required");
      });

      it("should fail when name is too short", () => {
        const product = new Product(makeValidProps({ name: "A" }));
        const messages = getValidationMessages(() => product.validate());
        expect(messages.some((m) => m.includes("min"))).toBe(true);
      });

      it("should fail when name exceeds max length", () => {
        const product = new Product(makeValidProps({ name: "A".repeat(121) }));
        const messages = getValidationMessages(() => product.validate());
        expect(messages.some((m) => m.includes("max"))).toBe(true);
      });

      it("should pass for name with exactly 2 characters", () => {
        const product = new Product(makeValidProps({ name: "AB" }));
        expect(() => product.validate()).not.toThrow();
      });

      it("should pass for name with exactly 120 characters", () => {
        const product = new Product(makeValidProps({ name: "A".repeat(120) }));
        expect(() => product.validate()).not.toThrow();
      });
    });

    describe("description", () => {
      it("should pass when description is null", () => {
        const product = new Product(makeValidProps({ description: null }));
        expect(() => product.validate()).not.toThrow();
      });

      it("should pass when description is undefined", () => {
        const product = new Product(makeValidProps({ description: undefined }));
        expect(() => product.validate()).not.toThrow();
      });

      it("should fail when description exceeds max length", () => {
        const product = new Product(
          makeValidProps({ description: "A".repeat(501) }),
        );
        const messages = getValidationMessages(() => product.validate());
        expect(messages.some((m) => m.includes("max"))).toBe(true);
      });

      it("should pass for description with exactly 500 characters", () => {
        const product = new Product(
          makeValidProps({ description: "A".repeat(500) }),
        );
        expect(() => product.validate()).not.toThrow();
      });
    });

    describe("price", () => {
      it("should fail when price is missing", () => {
        const product = new Product(
          makeValidProps({ price: undefined as unknown as number }),
        );
        const messages = getValidationMessages(() => product.validate());
        expect(messages.some((m) => m.includes("required"))).toBe(true);
      });

      it("should fail when price is negative", () => {
        const product = new Product(makeValidProps({ price: -0.01 }));
        const messages = getValidationMessages(() => product.validate());
        expect(messages.some((m) => m.includes("min"))).toBe(true);
      });

      it("should pass when price is zero", () => {
        const product = new Product(makeValidProps({ price: 0 }));
        expect(() => product.validate()).not.toThrow();
      });

      it("should fail when price has more than 2 decimal places", () => {
        const product = new Product(makeValidProps({ price: 10.999 }));
        const messages = getValidationMessages(() => product.validate());
        expect(messages.some((m) => m.includes("precision"))).toBe(true);
      });

      it("should pass when price has exactly 2 decimal places", () => {
        const product = new Product(makeValidProps({ price: 10.99 }));
        expect(() => product.validate()).not.toThrow();
      });

      it("should pass when price is integer", () => {
        const product = new Product(makeValidProps({ price: 50 }));
        expect(() => product.validate()).not.toThrow();
      });
    });

    describe("status", () => {
      it("should fail when status is empty", () => {
        const product = new Product(
          makeValidProps({ status: "" as ProductStatus }),
        );
        const messages = getValidationMessages(() => product.validate());
        expect(messages.some((m) => m.includes("required"))).toBe(true);
      });

      it("should fail when status is invalid value", () => {
        const product = new Product(
          makeValidProps({ status: "published" as ProductStatus }),
        );
        const messages = getValidationMessages(() => product.validate());
        expect(messages.some((m) => m.includes("in"))).toBe(true);
      });

      it("should pass for active status", () => {
        const product = new Product(makeValidProps({ status: "active" }));
        expect(() => product.validate()).not.toThrow();
      });

      it("should pass for inactive status", () => {
        const product = new Product(makeValidProps({ status: "inactive" }));
        expect(() => product.validate()).not.toThrow();
      });

      it("should pass for draft status", () => {
        const product = new Product(makeValidProps({ status: "draft" }));
        expect(() => product.validate()).not.toThrow();
      });
    });
  });

  describe("clone()", () => {
    it("should preserve id and createdAt, update updatedAt", () => {
      const product = new Product(makeValidProps());
      const cloned = product.clone({ name: "Produto Clonado" });

      expect(cloned.id).toBe(product.id);
      expect(cloned.createdAt).toEqual(product.createdAt);
      expect(cloned.name).toBe("Produto Clonado");
      expect(cloned.updatedAt.getTime()).toBeGreaterThanOrEqual(
        product.updatedAt.getTime(),
      );
    });

    it("should allow updating status via clone", () => {
      const product = new Product(makeValidProps({ status: "active" }));
      const cloned = product.clone({ status: "inactive" });
      expect(cloned.status).toBe("inactive");
    });
  });

  describe("equals()", () => {
    it("should return true for same id", () => {
      const id = "550e8400-e29b-41d4-a716-446655440000";
      const a = new Product(makeValidProps({ id }));
      const b = new Product(makeValidProps({ id }));
      expect(a.equals(b)).toBe(true);
    });

    it("should return false for different ids", () => {
      const a = new Product(makeValidProps());
      const b = new Product(makeValidProps());
      expect(a.equals(b)).toBe(false);
    });

    it("should return false for null", () => {
      const product = new Product(makeValidProps());
      expect(product.equals(null)).toBe(false);
    });
  });
});
