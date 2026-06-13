import { describe, it, expect } from "vitest";

// Design System Tests
describe("Design System", () => {
  describe("Colors", () => {
    it("should have primary color defined", async () => {
      const { colors } = await import("../constants/design-system");
      // Updated for Black Base + Pink Accent palette
      expect(colors.primary.default).toBe("#EC4899");
    });

    it("should have background colors defined", async () => {
      const { colors } = await import("../constants/design-system");
      // Updated for Black Base palette
      expect(colors.background.primary).toBe("#0a0a0a");
      expect(colors.background.secondary).toBe("#171717");
    });

    it("should have status colors defined", async () => {
      const { colors } = await import("../constants/design-system");
      // Updated for Black Base + Pink Accent palette
      expect(colors.status.success).toBe("#22C55E"); // green
      expect(colors.status.error).toBe("#EF4444");   // red
      expect(colors.status.warning).toBe("#A855F7"); // purple (yellow deprecated)
    });
  });

  describe("Spacing", () => {
    it("should have 8px base spacing", async () => {
      const { spacing } = await import("../constants/design-system");
      expect(spacing.sm).toBe(8);
    });

    it("should have consistent spacing scale", async () => {
      const { spacing } = await import("../constants/design-system");
      expect(spacing.xs).toBe(4);
      expect(spacing.md).toBe(12);
      expect(spacing.lg).toBe(16);
      expect(spacing.xl).toBe(24);
    });
  });

  describe("Touch Targets", () => {
    it("should have minimum size of 44px (Apple HIG)", async () => {
      const { touchTarget } = await import("../constants/design-system");
      expect(touchTarget.minSize).toBe(44);
    });

    it("should have minimum spacing of 8dp", async () => {
      const { touchTarget } = await import("../constants/design-system");
      expect(touchTarget.minSpacing).toBe(8);
    });
  });

  describe("Animation", () => {
    it("should have fast animation under 200ms", async () => {
      const { animation } = await import("../constants/design-system");
      expect(animation.duration.fast).toBeLessThanOrEqual(200);
    });

    it("should have normal animation under 300ms", async () => {
      const { animation } = await import("../constants/design-system");
      expect(animation.duration.normal).toBeLessThanOrEqual(300);
    });
  });
});

// Validation Tests
describe("Validation", () => {
  describe("Required", () => {
    it("should fail for empty string", async () => {
      const { required } = await import("../lib/validation");
      const validator = required();
      expect(validator("").valid).toBe(false);
    });

    it("should pass for non-empty string", async () => {
      const { required } = await import("../lib/validation");
      const validator = required();
      expect(validator("test").valid).toBe(true);
    });
  });

  describe("Min Length", () => {
    it("should fail for short string", async () => {
      const { minLength } = await import("../lib/validation");
      const validator = minLength(5);
      expect(validator("abc").valid).toBe(false);
    });

    it("should pass for long enough string", async () => {
      const { minLength } = await import("../lib/validation");
      const validator = minLength(5);
      expect(validator("abcdef").valid).toBe(true);
    });
  });

  describe("Max Length", () => {
    it("should fail for long string", async () => {
      const { maxLength } = await import("../lib/validation");
      const validator = maxLength(5);
      expect(validator("abcdefgh").valid).toBe(false);
    });

    it("should pass for short enough string", async () => {
      const { maxLength } = await import("../lib/validation");
      const validator = maxLength(5);
      expect(validator("abc").valid).toBe(true);
    });
  });

  describe("Email", () => {
    it("should fail for invalid email", async () => {
      const { email } = await import("../lib/validation");
      const validator = email();
      expect(validator("notanemail").valid).toBe(false);
    });

    it("should pass for valid email", async () => {
      const { email } = await import("../lib/validation");
      const validator = email();
      expect(validator("test@example.com").valid).toBe(true);
    });
  });

  describe("Compose", () => {
    it("should combine validators", async () => {
      const { compose, required, minLength, maxLength } = await import("../lib/validation");
      const validator = compose(required(), minLength(3), maxLength(10));
      expect(validator("").valid).toBe(false);
      expect(validator("ab").valid).toBe(false);
      expect(validator("abc").valid).toBe(true);
      expect(validator("abcdefghijk").valid).toBe(false);
    });
  });

  describe("Form Validation", () => {
    it("should validate entire form", async () => {
      const { validateForm, required, email } = await import("../lib/validation");
      const values = {
        name: "Test",
        email: "test@example.com",
      };
      const validators = {
        name: required(),
        email: email(),
      };
      const result = validateForm(values, validators);
      expect(result.valid).toBe(true);
    });

    it("should return errors for invalid form", async () => {
      const { validateForm, required, email } = await import("../lib/validation");
      const values = {
        name: "",
        email: "invalid",
      };
      const validators = {
        name: required(),
        email: email(),
      };
      const result = validateForm(values, validators);
      expect(result.valid).toBe(false);
      expect(result.errors.name).toBeDefined();
      expect(result.errors.email).toBeDefined();
    });
  });
});
