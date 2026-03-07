/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

import type { Mock } from 'vitest';

declare global {
  const vi: {
    mock: (module: string, factory?: () => unknown) => void;
    resetAllMocks: () => void;
    spyOn: <T>(obj: T, key: keyof T) => {
      mockResolvedValue: (value: unknown) => void;
      mockImplementation: (fn: (...args: unknown[]) => unknown) => void;
    };
    mocked: <T>(obj: T) => T & { mockResolvedValue: (value: unknown) => void; mockImplementation: (fn: (...args: unknown[]) => unknown) => void };
    fn: <T extends (...args: unknown[]) => unknown = () => Promise<void>>(implementation?: T) => Mock<T>;
    clearAllMocks: () => void;
  };
}
