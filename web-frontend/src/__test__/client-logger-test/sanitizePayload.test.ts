import { sanitizePayload } from "../../shared/logger/client-logger/model/helpers";

// Helper type for objects that can have circular references
type CircularObject = Record<string, unknown> & { [key: string]: unknown };

describe("sanitizePayload", () => {
  describe("circular reference handling", () => {
    it("should handle direct circular references without looping", () => {
      const obj: CircularObject = { name: "test", value: 123 };
      obj.self = obj; // Direct circular reference

      const result = sanitizePayload(obj);

      expect(result).toBeDefined();
      expect(result.name).toBe("test");
      expect(result.value).toBe(123);
      expect(result.self).toBeDefined();
    });

    it("should handle nested circular references without looping", () => {
      const obj: CircularObject = {
        name: "parent",
        child: {
          name: "child",
          value: 456,
        },
      };
      (obj.child as CircularObject).parent = obj; // Nested circular reference

      const result = sanitizePayload(obj);

      expect(result).toBeDefined();
      expect(result.name).toBe("parent");
      expect((result.child as CircularObject).name).toBe("child");
      expect((result.child as CircularObject).value).toBe(456);
      expect((result.child as CircularObject).parent).toBeDefined();
    });

    it("should handle multiple circular references without looping", () => {
      const objA: CircularObject = { name: "A" };
      const objB: CircularObject = { name: "B" };
      objA.refB = objB;
      objB.refA = objA;
      objA.selfRef = objA;

      const result = sanitizePayload(objA);

      expect(result).toBeDefined();
      expect(result.name).toBe("A");
      expect((result.refB as CircularObject).name).toBe("B");
      expect(result.selfRef).toBeDefined();
    });

    it("should complete within reasonable time for deep circular structures", () => {
      const obj: CircularObject = { level: 0 };
      let current: CircularObject = obj;

      // Create a deep nested structure
      for (let i = 1; i < 100; i++) {
        current.next = { level: i };
        current = current.next as CircularObject;
      }
      // Add circular reference at the end
      current.backToStart = obj;

      const startTime = Date.now();
      const result = sanitizePayload(obj);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });
  });

  describe("sensitive data redaction", () => {
    it("should redact password fields", () => {
      const obj = {
        username: "john",
        password: "secret123",
        userPassword: "secret456",
      };

      const result = sanitizePayload(obj);

      expect(result.username).toBe("john");
      expect(result.password).toBe("[REDACTED]");
      expect(result.userPassword).toBe("[REDACTED]");
    });

    it("should redact token fields", () => {
      const obj = {
        data: "public",
        apiToken: "abc123",
        authToken: "xyz789",
      };

      const result = sanitizePayload(obj);

      expect(result.data).toBe("public");
      expect(result.apiToken).toBe("[REDACTED]");
      expect(result.authToken).toBe("[REDACTED]");
    });

    it("should redact secret, key, auth, and credential fields", () => {
      const obj = {
        secretKey: "secret",
        apiKey: "key123",
        authHeader: "Bearer token",
        userCredential: "cred",
      };

      const result = sanitizePayload(obj);

      expect(result.secretKey).toBe("[REDACTED]");
      expect(result.apiKey).toBe("[REDACTED]");
      expect(result.authHeader).toBe("[REDACTED]");
      expect(result.userCredential).toBe("[REDACTED]");
    });

    it("should redact sensitive fields in nested objects", () => {
      const obj = {
        user: {
          name: "john",
          password: "secret",
        },
        config: {
          apiKey: "key123",
        },
      };

      const result = sanitizePayload(obj);

      expect((result.user as Record<string, unknown>).name).toBe("john");
      expect((result.user as Record<string, unknown>).password).toBe(
        "[REDACTED]"
      );
      expect((result.config as Record<string, unknown>).apiKey).toBe(
        "[REDACTED]"
      );
    });

    it("should handle case-insensitive sensitive field names", () => {
      const obj = {
        PASSWORD: "secret",
        ApiToken: "token",
        SECRET_KEY: "key",
      };

      const result = sanitizePayload(obj);

      expect(result.PASSWORD).toBe("[REDACTED]");
      expect(result.ApiToken).toBe("[REDACTED]");
      expect(result.SECRET_KEY).toBe("[REDACTED]");
    });
  });

  describe("edge cases", () => {
    it("should handle null values", () => {
      const obj = { value: null };
      const result = sanitizePayload(obj);
      expect(result.value).toBeNull();
    });

    it("should handle undefined values", () => {
      const obj = { value: undefined };
      const result = sanitizePayload(obj);
      expect(result.value).toBeUndefined();
    });

    it("should handle arrays", () => {
      const obj = {
        items: [1, 2, 3],
        users: [{ name: "john", password: "secret" }],
      };

      const result = sanitizePayload(obj);

      expect(result.items).toEqual([1, 2, 3]);
      expect((result.users as Array<Record<string, unknown>>)[0].name).toBe(
        "john"
      );
      expect((result.users as Array<Record<string, unknown>>)[0].password).toBe(
        "[REDACTED]"
      );
    });

    it("should handle empty objects", () => {
      const obj = {};
      const result = sanitizePayload(obj);
      expect(result).toEqual({});
    });

    it("should not modify original object", () => {
      const obj = {
        name: "test",
        password: "secret",
      };

      const result = sanitizePayload(obj);

      expect(obj.password).toBe("secret"); // Original unchanged
      expect(result.password).toBe("[REDACTED]"); // Copy is sanitized
    });

    it("should handle non-object inputs gracefully", () => {
      expect(
        sanitizePayload(null as unknown as Record<string, unknown>)
      ).toBeNull();
      expect(
        sanitizePayload(undefined as unknown as Record<string, unknown>)
      ).toBeUndefined();
      expect(
        sanitizePayload("string" as unknown as Record<string, unknown>)
      ).toBe("string");
      expect(sanitizePayload(123 as unknown as Record<string, unknown>)).toBe(
        123
      );
    });
  });

  describe("combined scenarios", () => {
    it("should handle circular references with sensitive data", () => {
      const obj: CircularObject = {
        name: "user",
        password: "secret123",
        config: {
          apiKey: "key456",
        },
      };
      obj.self = obj;
      (obj.config as CircularObject).parent = obj;

      const result = sanitizePayload(obj);

      expect(result.name).toBe("user");
      expect(result.password).toBe("[REDACTED]");
      expect((result.config as CircularObject).apiKey).toBe("[REDACTED]");
      expect(result.self).toBeDefined();
      expect((result.config as CircularObject).parent).toBeDefined();
    });

    it("should handle deeply nested objects with circular refs and sensitive data", () => {
      const obj: CircularObject = {
        level1: {
          token: "secret",
          level2: {
            password: "pass",
            level3: {
              apiKey: "key",
            },
          },
        },
      };
      (
        ((obj.level1 as CircularObject).level2 as CircularObject)
          .level3 as CircularObject
      ).backToRoot = obj;

      const result = sanitizePayload(obj);

      expect((result.level1 as CircularObject).token).toBe("[REDACTED]");
      expect(
        ((result.level1 as CircularObject).level2 as CircularObject).password
      ).toBe("[REDACTED]");
      expect(
        (
          ((result.level1 as CircularObject).level2 as CircularObject)
            .level3 as CircularObject
        ).apiKey
      ).toBe("[REDACTED]");
      expect(
        (
          ((result.level1 as CircularObject).level2 as CircularObject)
            .level3 as CircularObject
        ).backToRoot
      ).toBeDefined();
    });
  });
});
