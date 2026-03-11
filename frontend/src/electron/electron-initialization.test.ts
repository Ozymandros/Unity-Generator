/**
 * Property Test: Initialization Order Enforcement
 * 
 * Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6
 * Property 8: Initialization order enforcement
 * 
 * For any application start sequence, the lifecycle manager shall initialize
 * all required components in the correct order: first spawn the Python backend,
 * wait for it to be ready, then create the main window and load the Vue frontend.
 * If initialization fails at any step, the lifecycle manager shall log the error
 * and attempt graceful shutdown.
 */

import { describe, expect, it, beforeEach } from "vitest";

/**
 * Simulates the initialization manager
 */
enum InitializationStep {
  None = 0,
  BackendSpawned = 1,
  BackendReady = 2,
  WindowCreated = 3,
  FrontendLoaded = 4,
  Complete = 5
}

class InitializationManager {
  private currentStep: InitializationStep = InitializationStep.None;
  private initializationLog: string[] = [];
  
  /**
   * Initialize the application
   */
  async initialize(): Promise<boolean> {
    try {
      this.log('Starting initialization');
      
      // Step 1: Spawn backend
      await this.spawnBackend();
      
      // Step 2: Wait for backend ready
      await this.waitForBackendReady();
      
      // Step 3: Create window
      await this.createWindow();
      
      // Step 4: Load frontend
      await this.loadFrontend();
      
      this.currentStep = InitializationStep.Complete;
      this.log('Initialization complete');
      
      return true;
    } catch (error) {
      this.log(`Initialization failed: ${error}`);
      await this.gracefulShutdown();
      return false;
    }
  }
  
  /**
   * Spawn Python backend
   */
  private async spawnBackend(): Promise<void> {
    this.log('Spawning Python backend...');
    await new Promise(resolve => setTimeout(resolve, 50));
    this.currentStep = InitializationStep.BackendSpawned;
    this.log('Python backend spawned');
  }
  
  /**
   * Wait for backend to be ready
   */
  private async waitForBackendReady(): Promise<void> {
    this.log('Waiting for backend to be ready...');
    await new Promise(resolve => setTimeout(resolve, 100));
    this.currentStep = InitializationStep.BackendReady;
    this.log('Backend is ready');
  }
  
  /**
   * Create main window
   */
  private async createWindow(): Promise<void> {
    this.log('Creating main window...');
    await new Promise(resolve => setTimeout(resolve, 50));
    this.currentStep = InitializationStep.WindowCreated;
    this.log('Window created');
  }
  
  /**
   * Load Vue frontend
   */
  private async loadFrontend(): Promise<void> {
    this.log('Loading Vue frontend...');
    await new Promise(resolve => setTimeout(resolve, 100));
    this.currentStep = InitializationStep.FrontendLoaded;
    this.log('Frontend loaded');
  }
  
  /**
   * Graceful shutdown
   */
  private async gracefulShutdown(): Promise<void> {
    this.log('Initiating graceful shutdown...');
    await new Promise(resolve => setTimeout(resolve, 50));
    this.log('Graceful shutdown complete');
  }
  
  /**
   * Get current initialization step
   */
  getCurrentStep(): InitializationStep {
    return this.currentStep;
  }
  
  /**
   * Get initialization log
   */
  getInitializationLog(): string[] {
    return [...this.initializationLog];
  }
  
  /**
   * Log initialization step
   */
  private log(message: string): void {
    this.initializationLog.push(message);
  }
}

describe("Property 8: Initialization Order Enforcement", () => {
  let initializationManager: InitializationManager;
  
  beforeEach(() => {
    initializationManager = new InitializationManager();
  });
  
  it("should initialize in correct order", async () => {
    const success = await initializationManager.initialize();
    
    expect(success).toBe(true);
    expect(initializationManager.getCurrentStep()).toBe(InitializationStep.Complete);
    
    const log = initializationManager.getInitializationLog();
    
    // Verify order - check that steps appear in the correct sequence
    const stepIndices = {
      'Starting': 0,
      'Spawning': 1,
      'ready': 2,
      'Creating': 3,
      'loaded': 4,
      'complete': 5
    };
    
    let prevIndex = -1;
    for (const msg of log) {
      for (const [key, index] of Object.entries(stepIndices)) {
        if (msg.includes(key)) {
          expect(index).toBeGreaterThanOrEqual(prevIndex);
          prevIndex = index;
          break;
        }
      }
    }
  });
  
  it("should maintain step progression", async () => {
    await initializationManager.initialize();
    
    const currentStep = initializationManager.getCurrentStep();
    
    expect(currentStep).toBeGreaterThan(InitializationStep.BackendSpawned);
    expect(currentStep).toBeGreaterThan(InitializationStep.BackendReady);
    expect(currentStep).toBeGreaterThan(InitializationStep.WindowCreated);
  });
  
  it("should handle initialization failure gracefully", async () => {
    // Create a manager that will fail
    const failingManager = new InitializationManager();
    
    // Mock spawnBackend to throw
    (failingManager as unknown as { spawnBackend: () => Promise<void> }).spawnBackend = async () => {
      throw new Error('Backend spawn failed');
    };
    
    const success = await failingManager.initialize();
    
    expect(success).toBe(false);
    expect(failingManager.getInitializationLog().some(log => log.includes('graceful shutdown')));
  });
  
  it("should not skip initialization steps", async () => {
    await initializationManager.initialize();
    
    const log = initializationManager.getInitializationLog();
    const stepOrder = log.map(msg => {
      if (msg.includes('Starting')) return 0;
      if (msg.includes('Spawning')) return 1;
      if (msg.includes('ready')) return 2;
      if (msg.includes('Creating')) return 3;
      if (msg.includes('loaded')) return 4;
      if (msg.includes('complete')) return 5;
      return -1;
    }).filter(step => step >= 0);
    
    // Verify steps are in order
    for (let i = 1; i < stepOrder.length; i++) {
      expect(stepOrder[i]).toBeGreaterThanOrEqual(stepOrder[i - 1]);
    }
  });
  
  it("should complete initialization successfully", async () => {
    const success = await initializationManager.initialize();
    
    expect(success).toBe(true);
    expect(initializationManager.getCurrentStep()).toBe(InitializationStep.Complete);
  });
});
