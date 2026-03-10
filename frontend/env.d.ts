/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<
    Record<string, unknown>,
    Record<string, unknown>,
    unknown
  >;
  export default component;
}

declare module "@/components/StatusBanner" {
  import type { DefineComponent } from "vue";
  const StatusBanner: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export { StatusBanner };
  export default StatusBanner;
}

declare module "@/components/generic/SmartField" {
  import type { DefineComponent } from "vue";
  const SmartField: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export { SmartField };
  export default SmartField;
}

declare module "@/components/generic/ModelManagerModal" {
  import type { DefineComponent } from "vue";
  const ModelManagerModal: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export { ModelManagerModal };
  export default ModelManagerModal;
}
