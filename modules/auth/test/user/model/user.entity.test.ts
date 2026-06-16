import { ValidationException } from "@sdd/shared";
import { User, UserState } from "../../../src/user/model/user.entity";

const VALID_HASH =
  "$2b$10$abcdefghijklmnopqrstuvwxABCDEFGHIJKLMNOPQRSTUVWX01234";

function getValidationMessages(callback: () => void): string[] {
  try {
    callback();
    return [];
  } catch (error) {
    return (error as ValidationException).errors.map((item) => item.message);
  }
}

function makeValidProps(overrides: Partial<UserState> = {}): UserState {
  return {
    name: "Maria Silva",
    email: "maria@example.com",
    password: VALID_HASH,
    ...overrides,
  };
}

describe("User entity", () => {
  describe("construction", () => {
    it("should create a valid user with generated id and timestamps", () => {
      const user = new User(makeValidProps());

      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(user.deletedAt).toBeNull();
    });

    it("should preserve provided id", () => {
      const id = "550e8400-e29b-41d4-a716-446655440000";
      const user = new User(makeValidProps({ id }));
      expect(user.id).toBe(id);
    });

    it("should preserve provided timestamps", () => {
      const createdAt = new Date("2024-01-01T00:00:00Z");
      const updatedAt = new Date("2024-01-02T00:00:00Z");
      const user = new User(makeValidProps({ createdAt, updatedAt }));
      expect(user.createdAt).toEqual(createdAt);
      expect(user.updatedAt).toEqual(updatedAt);
    });

    it("should set deletedAt when provided", () => {
      const deletedAt = new Date("2024-06-01T00:00:00Z");
      const user = new User(makeValidProps({ deletedAt }));
      expect(user.deletedAt).toEqual(deletedAt);
    });
  });

  describe("getters", () => {
    it("should return correct name", () => {
      const user = new User(makeValidProps({ name: "João Souza" }));
      expect(user.name).toBe("João Souza");
    });

    it("should return correct email", () => {
      const user = new User(makeValidProps({ email: "joao@test.com" }));
      expect(user.email).toBe("joao@test.com");
    });

    it("should return correct password", () => {
      const user = new User(makeValidProps({ password: VALID_HASH }));
      expect(user.password).toBe(VALID_HASH);
    });
  });

  describe("lazy validation", () => {
    it("should not throw during construction even with invalid data", () => {
      expect(() => new User(makeValidProps({ name: "" }))).not.toThrow();
      expect(() => new User(makeValidProps({ email: "invalid" }))).not.toThrow();
      expect(
        () => new User(makeValidProps({ password: "not-a-hash" })),
      ).not.toThrow();
    });
  });

  describe("validate()", () => {
    it("should not throw for valid data", () => {
      const user = new User(makeValidProps());
      expect(() => user.validate()).not.toThrow();
    });

    describe("name", () => {
      it("should fail when name is empty", () => {
        const user = new User(makeValidProps({ name: "" }));
        const messages = getValidationMessages(() => user.validate());
        expect(messages).toContain("user.name.required");
      });

      it("should fail when name is too short", () => {
        const user = new User(makeValidProps({ name: "Ab" }));
        const messages = getValidationMessages(() => user.validate());
        expect(messages.some((m) => m.includes("min"))).toBe(true);
      });

      it("should fail when name exceeds max length", () => {
        const longName = "Ana " + "A".repeat(78);
        const user = new User(makeValidProps({ name: longName }));
        const messages = getValidationMessages(() => user.validate());
        expect(messages.some((m) => m.includes("max"))).toBe(true);
      });

      it("should fail when name has no space (not a full person name)", () => {
        const user = new User(makeValidProps({ name: "NoLastName" }));
        const messages = getValidationMessages(() => user.validate());
        expect(messages).toContain("user.name.person.name");
      });

      it("should pass for a name with first and last name", () => {
        const user = new User(makeValidProps({ name: "Ana Boa" }));
        expect(() => user.validate()).not.toThrow();
      });
    });

    describe("email", () => {
      it("should fail when email is empty", () => {
        const user = new User(makeValidProps({ email: "" }));
        const messages = getValidationMessages(() => user.validate());
        expect(messages).toContain("user.email.required");
      });

      it("should fail when email is invalid", () => {
        const user = new User(makeValidProps({ email: "not-an-email" }));
        const messages = getValidationMessages(() => user.validate());
        expect(messages).toContain("user.email.invalid.email");
      });

      it("should pass for valid email", () => {
        const user = new User(makeValidProps({ email: "user@domain.com" }));
        expect(() => user.validate()).not.toThrow();
      });
    });

    describe("password", () => {
      it("should fail when password is not a bcrypt hash", () => {
        const user = new User(makeValidProps({ password: "plain-text-pass" }));
        const messages = getValidationMessages(() => user.validate());
        expect(messages).toContain("user.password.bcrypt.hash");
      });

      it("should pass for valid bcrypt hash", () => {
        const user = new User(makeValidProps({ password: VALID_HASH }));
        expect(() => user.validate()).not.toThrow();
      });

      it("should pass when password is empty (bcrypt rule skips empty values)", () => {
        const user = new User(makeValidProps({ password: "" }));
        expect(() => user.validate()).not.toThrow();
      });
    });
  });

  describe("clone()", () => {
    it("should preserve id and createdAt, update updatedAt", () => {
      const user = new User(makeValidProps());
      const cloned = user.clone({ name: "Carlos Moura" });

      expect(cloned.id).toBe(user.id);
      expect(cloned.createdAt).toEqual(user.createdAt);
      expect(cloned.name).toBe("Carlos Moura");
      expect(cloned.updatedAt.getTime()).toBeGreaterThanOrEqual(
        user.updatedAt.getTime(),
      );
    });

    it("should allow updating email via clone", () => {
      const user = new User(makeValidProps());
      const cloned = user.clone({ email: "new@email.com" });
      expect(cloned.email).toBe("new@email.com");
    });
  });

  describe("equals()", () => {
    it("should return true for same id", () => {
      const id = "550e8400-e29b-41d4-a716-446655440000";
      const a = new User(makeValidProps({ id }));
      const b = new User(makeValidProps({ id }));
      expect(a.equals(b)).toBe(true);
    });

    it("should return false for different ids", () => {
      const a = new User(makeValidProps());
      const b = new User(makeValidProps());
      expect(a.equals(b)).toBe(false);
    });

    it("should return false for null", () => {
      const user = new User(makeValidProps());
      expect(user.equals(null)).toBe(false);
    });
  });
});
