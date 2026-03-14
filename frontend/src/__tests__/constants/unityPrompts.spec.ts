import { describe, it, expect } from "vitest";
import {
  UNITY_PROMPTS,
  QUICK_ACTIONS,
  EXAMPLE_PROMPTS,
  type QuickAction,
  type ExamplePrompt,
  type PromptCategory,
} from "@/constants/unityPrompts";

/**
 * Unit tests for Unity prompt constants.
 * 
 * **Property 12: Quick Actions Reference Constants**
 * 
 * These tests validate that:
 * - UNITY_PROMPTS contains all 6 quick actions
 * - EXAMPLE_PROMPTS contains at least 6 examples
 * - All prompts are non-empty strings
 * - All categories are valid
 * 
 * Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.8, 8.7
 */
describe("Unity Prompts Constants", () => {
  describe("UNITY_PROMPTS", () => {
    it("should contain all required prototype prompts", () => {
      expect(UNITY_PROMPTS.prototype).toBeDefined();
      expect(UNITY_PROMPTS.prototype.fps).toBeDefined();
      expect(UNITY_PROMPTS.prototype.platformer).toBeDefined();
    });

    it("should contain all required scene prompts", () => {
      expect(UNITY_PROMPTS.scene).toBeDefined();
      expect(UNITY_PROMPTS.scene.objects).toBeDefined();
    });

    it("should contain all required UI prompts", () => {
      expect(UNITY_PROMPTS.ui).toBeDefined();
      expect(UNITY_PROMPTS.ui.canvas).toBeDefined();
    });

    it("should contain all required animation prompts", () => {
      expect(UNITY_PROMPTS.animation).toBeDefined();
      expect(UNITY_PROMPTS.animation.characterAnimator).toBeDefined();
      expect(UNITY_PROMPTS.animation.introCutscene).toBeDefined();
    });

    it("should have non-empty string values for all prompts", () => {
      // Prototype prompts
      expect(typeof UNITY_PROMPTS.prototype.fps).toBe("string");
      expect(UNITY_PROMPTS.prototype.fps.trim().length).toBeGreaterThan(0);
      
      expect(typeof UNITY_PROMPTS.prototype.platformer).toBe("string");
      expect(UNITY_PROMPTS.prototype.platformer.trim().length).toBeGreaterThan(0);

      // Scene prompts
      expect(typeof UNITY_PROMPTS.scene.objects).toBe("string");
      expect(UNITY_PROMPTS.scene.objects.trim().length).toBeGreaterThan(0);

      // UI prompts
      expect(typeof UNITY_PROMPTS.ui.canvas).toBe("string");
      expect(UNITY_PROMPTS.ui.canvas.trim().length).toBeGreaterThan(0);

      // Animation prompts
      expect(typeof UNITY_PROMPTS.animation.characterAnimator).toBe("string");
      expect(UNITY_PROMPTS.animation.characterAnimator.trim().length).toBeGreaterThan(0);
      
      expect(typeof UNITY_PROMPTS.animation.introCutscene).toBe("string");
      expect(UNITY_PROMPTS.animation.introCutscene.trim().length).toBeGreaterThan(0);
    });

    it("should have descriptive prompts with sufficient detail", () => {
      // Each prompt should be at least 20 characters (reasonable minimum for descriptive text)
      expect(UNITY_PROMPTS.prototype.fps.length).toBeGreaterThan(20);
      expect(UNITY_PROMPTS.prototype.platformer.length).toBeGreaterThan(20);
      expect(UNITY_PROMPTS.scene.objects.length).toBeGreaterThan(20);
      expect(UNITY_PROMPTS.ui.canvas.length).toBeGreaterThan(20);
      expect(UNITY_PROMPTS.animation.characterAnimator.length).toBeGreaterThan(20);
      expect(UNITY_PROMPTS.animation.introCutscene.length).toBeGreaterThan(20);
    });
  });

  describe("QUICK_ACTIONS", () => {
    it("should contain exactly 6 quick actions", () => {
      expect(QUICK_ACTIONS).toHaveLength(6);
    });

    it("should have all required quick actions", () => {
      const labels = QUICK_ACTIONS.map(action => action.label);
      
      expect(labels).toContain("FPS Prototype");
      expect(labels).toContain("Platformer Prototype");
      expect(labels).toContain("Add UI Canvas");
      expect(labels).toContain("Character Animator");
      expect(labels).toContain("Intro Cutscene");
      expect(labels).toContain("Scene with Objects");
    });

    it("should have valid structure for each quick action", () => {
      QUICK_ACTIONS.forEach((action: QuickAction) => {
        expect(action).toHaveProperty("label");
        expect(action).toHaveProperty("icon");
        expect(action).toHaveProperty("prompt");
        expect(action).toHaveProperty("category");
      });
    });

    it("should have non-empty strings for all properties", () => {
      QUICK_ACTIONS.forEach((action: QuickAction) => {
        expect(typeof action.label).toBe("string");
        expect(action.label.trim().length).toBeGreaterThan(0);
        
        expect(typeof action.icon).toBe("string");
        expect(action.icon.trim().length).toBeGreaterThan(0);
        
        expect(typeof action.prompt).toBe("string");
        expect(action.prompt.trim().length).toBeGreaterThan(0);
        
        expect(typeof action.category).toBe("string");
        expect(action.category.trim().length).toBeGreaterThan(0);
      });
    });

    it("should have valid Material Design Icons", () => {
      QUICK_ACTIONS.forEach((action: QuickAction) => {
        // MDI icons should start with "mdi-"
        expect(action.icon).toMatch(/^mdi-/);
      });
    });

    it("should have valid categories", () => {
      const validCategories: PromptCategory[] = ["prototype", "scene", "ui", "animation"];
      
      QUICK_ACTIONS.forEach((action: QuickAction) => {
        expect(validCategories).toContain(action.category);
      });
    });

    it("should reference prompts from UNITY_PROMPTS constant", () => {
      // Verify that quick actions use prompts from UNITY_PROMPTS
      const fpsAction = QUICK_ACTIONS.find(a => a.label === "FPS Prototype");
      expect(fpsAction?.prompt).toBe(UNITY_PROMPTS.prototype.fps);

      const platformerAction = QUICK_ACTIONS.find(a => a.label === "Platformer Prototype");
      expect(platformerAction?.prompt).toBe(UNITY_PROMPTS.prototype.platformer);

      const uiAction = QUICK_ACTIONS.find(a => a.label === "Add UI Canvas");
      expect(uiAction?.prompt).toBe(UNITY_PROMPTS.ui.canvas);

      const animatorAction = QUICK_ACTIONS.find(a => a.label === "Character Animator");
      expect(animatorAction?.prompt).toBe(UNITY_PROMPTS.animation.characterAnimator);

      const cutsceneAction = QUICK_ACTIONS.find(a => a.label === "Intro Cutscene");
      expect(cutsceneAction?.prompt).toBe(UNITY_PROMPTS.animation.introCutscene);

      const sceneAction = QUICK_ACTIONS.find(a => a.label === "Scene with Objects");
      expect(sceneAction?.prompt).toBe(UNITY_PROMPTS.scene.objects);
    });

    it("should have appropriate categories for each action", () => {
      const fpsAction = QUICK_ACTIONS.find(a => a.label === "FPS Prototype");
      expect(fpsAction?.category).toBe("prototype");

      const platformerAction = QUICK_ACTIONS.find(a => a.label === "Platformer Prototype");
      expect(platformerAction?.category).toBe("prototype");

      const uiAction = QUICK_ACTIONS.find(a => a.label === "Add UI Canvas");
      expect(uiAction?.category).toBe("ui");

      const animatorAction = QUICK_ACTIONS.find(a => a.label === "Character Animator");
      expect(animatorAction?.category).toBe("animation");

      const cutsceneAction = QUICK_ACTIONS.find(a => a.label === "Intro Cutscene");
      expect(cutsceneAction?.category).toBe("animation");

      const sceneAction = QUICK_ACTIONS.find(a => a.label === "Scene with Objects");
      expect(sceneAction?.category).toBe("scene");
    });
  });

  describe("EXAMPLE_PROMPTS", () => {
    it("should contain at least 6 example prompts", () => {
      expect(EXAMPLE_PROMPTS.length).toBeGreaterThanOrEqual(6);
    });

    it("should have valid structure for each example prompt", () => {
      EXAMPLE_PROMPTS.forEach((example: ExamplePrompt) => {
        expect(example).toHaveProperty("text");
        expect(example).toHaveProperty("category");
      });
    });

    it("should have non-empty strings for all properties", () => {
      EXAMPLE_PROMPTS.forEach((example: ExamplePrompt) => {
        expect(typeof example.text).toBe("string");
        expect(example.text.trim().length).toBeGreaterThan(0);
        
        expect(typeof example.category).toBe("string");
        expect(example.category.trim().length).toBeGreaterThan(0);
      });
    });

    it("should cover different capability categories", () => {
      const categories = EXAMPLE_PROMPTS.map(example => example.category);
      
      // Should have examples for various categories
      expect(categories).toContain("scene");
      expect(categories).toContain("animation");
      expect(categories).toContain("ui");
    });

    it("should have descriptive example text", () => {
      EXAMPLE_PROMPTS.forEach((example: ExamplePrompt) => {
        // Each example should be at least 15 characters
        expect(example.text.length).toBeGreaterThan(15);
      });
    });

    it("should have unique example texts", () => {
      const texts = EXAMPLE_PROMPTS.map(example => example.text);
      const uniqueTexts = new Set(texts);
      
      expect(uniqueTexts.size).toBe(texts.length);
    });
  });

  describe("Type Safety", () => {
    it("should have proper TypeScript types for QuickAction", () => {
      const testAction: QuickAction = {
        label: "Test Action",
        icon: "mdi-test",
        prompt: "Test prompt",
        category: "scene"
      };

      expect(testAction.label).toBe("Test Action");
      expect(testAction.icon).toBe("mdi-test");
      expect(testAction.prompt).toBe("Test prompt");
      expect(testAction.category).toBe("scene");
    });

    it("should have proper TypeScript types for ExamplePrompt", () => {
      const testExample: ExamplePrompt = {
        text: "Test example prompt",
        category: "test"
      };

      expect(testExample.text).toBe("Test example prompt");
      expect(testExample.category).toBe("test");
    });
  });

  describe("Const Assertion", () => {
    it("should use const assertion for type safety", () => {
      // Verify that UNITY_PROMPTS is readonly (const assertion)
      // TypeScript will enforce this at compile time
      // At runtime, we can verify the structure is as expected
      expect(Object.isFrozen(UNITY_PROMPTS)).toBe(false); // const assertion doesn't freeze, just types
      
      // Verify structure matches expected const assertion pattern
      expect(UNITY_PROMPTS).toHaveProperty("prototype");
      expect(UNITY_PROMPTS).toHaveProperty("scene");
      expect(UNITY_PROMPTS).toHaveProperty("ui");
      expect(UNITY_PROMPTS).toHaveProperty("animation");
    });
  });

  describe("Integration with Requirements", () => {
    it("should support FPS Prototype requirement (2.2)", () => {
      const fpsAction = QUICK_ACTIONS.find(a => a.label === "FPS Prototype");
      
      expect(fpsAction).toBeDefined();
      expect(fpsAction?.prompt).toContain("FPS");
      expect(fpsAction?.prompt).toContain("first-person");
      expect(fpsAction?.prompt).toContain("player controller");
    });

    it("should support Platformer Prototype requirement (2.3)", () => {
      const platformerAction = QUICK_ACTIONS.find(a => a.label === "Platformer Prototype");
      
      expect(platformerAction).toBeDefined();
      expect(platformerAction?.prompt).toContain("platformer");
      expect(platformerAction?.prompt).toContain("player character");
      expect(platformerAction?.prompt).toContain("jump");
    });

    it("should support Add UI Canvas requirement (2.4)", () => {
      const uiAction = QUICK_ACTIONS.find(a => a.label === "Add UI Canvas");
      
      expect(uiAction).toBeDefined();
      expect(uiAction?.prompt).toContain("UI canvas");
      expect(uiAction?.prompt).toContain("health bar");
    });

    it("should support Character Animator requirement (2.5)", () => {
      const animatorAction = QUICK_ACTIONS.find(a => a.label === "Character Animator");
      
      expect(animatorAction).toBeDefined();
      expect(animatorAction?.prompt).toContain("animator");
      expect(animatorAction?.prompt).toContain("idle");
      expect(animatorAction?.prompt).toContain("walk");
    });

    it("should support Intro Cutscene requirement (2.6)", () => {
      const cutsceneAction = QUICK_ACTIONS.find(a => a.label === "Intro Cutscene");
      
      expect(cutsceneAction).toBeDefined();
      expect(cutsceneAction?.prompt).toContain("timeline");
      expect(cutsceneAction?.prompt).toContain("cutscene");
    });

    it("should support Scene with Objects requirement (2.7)", () => {
      const sceneAction = QUICK_ACTIONS.find(a => a.label === "Scene with Objects");
      
      expect(sceneAction).toBeDefined();
      expect(sceneAction?.prompt).toContain("scene");
      expect(sceneAction?.prompt).toContain("cube");
    });

    it("should support example prompts requirement (3.8)", () => {
      expect(EXAMPLE_PROMPTS.length).toBeGreaterThanOrEqual(6);
      
      // Verify coverage of different categories
      const categories = new Set(EXAMPLE_PROMPTS.map(e => e.category));
      expect(categories.size).toBeGreaterThanOrEqual(4);
    });

    it("should support constants pattern requirement (8.7)", () => {
      // Verify that prompts are defined as constants and referenced
      expect(UNITY_PROMPTS).toBeDefined();
      expect(QUICK_ACTIONS).toBeDefined();
      
      // Verify quick actions reference the constants
      QUICK_ACTIONS.forEach(action => {
        const isReferencingConstant = 
          action.prompt === UNITY_PROMPTS.prototype.fps ||
          action.prompt === UNITY_PROMPTS.prototype.platformer ||
          action.prompt === UNITY_PROMPTS.scene.objects ||
          action.prompt === UNITY_PROMPTS.ui.canvas ||
          action.prompt === UNITY_PROMPTS.animation.characterAnimator ||
          action.prompt === UNITY_PROMPTS.animation.introCutscene;
        
        expect(isReferencingConstant).toBe(true);
      });
    });
  });
});
