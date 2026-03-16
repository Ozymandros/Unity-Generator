/**
 * Unity Physics Prompts Constants
 *
 * Example prompts for the Unity Physics panel.
 * Each entry is a complete, self-contained natural-language instruction
 * that the LLM can execute without further clarification.
 */

/**
 * An example prompt entry shown in the expandable examples section.
 */
export interface PhysicsExamplePrompt {
  /** Full prompt text */
  text: string;
  /** Category for grouping */
  category: string;
}

/**
 * Example prompts for the Unity Physics panel.
 * Covers common physics scenarios across rigidbodies, joints, triggers, and forces.
 */
export const PHYSICS_EXAMPLE_PROMPTS: PhysicsExamplePrompt[] = [
  {
    text: "Create a bouncy ball with Rigidbody, Sphere Collider, and a Physics Material with 0.8 bounciness and 0.1 friction",
    category: "rigidbody",
  },
  {
    text: "Create a door that swings open with a Hinge Joint, angular limits of -90° to 0°, and a spring force to return to closed",
    category: "joint",
  },
  {
    text: "Create a trigger zone that detects when the player enters and applies an upward force to launch them into the air",
    category: "trigger",
  },
  {
    text: "Create a vehicle wheel setup using WheelColliders with motor torque, brake torque, and steering angle properties",
    category: "vehicle",
  },
  {
    text: "Create a ragdoll character with Rigidbodies and Configurable Joints on each limb, toggled by a public EnableRagdoll() method",
    category: "ragdoll",
  },
  {
    text: "Create a gravity field zone that overrides global gravity for any Rigidbody inside it using a custom gravitational direction",
    category: "gravity",
  },
  {
    text: "Create a rope simulation using a chain of Rigidbodies connected by Fixed Joints with a configurable segment count and length",
    category: "joint",
  },
  {
    text: "Create a physics-based projectile with Rigidbody, initial velocity, drag, and a collision handler that spawns a particle effect on impact",
    category: "rigidbody",
  },
];
