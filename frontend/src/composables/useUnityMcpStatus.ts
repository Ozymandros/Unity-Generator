import { onMounted, ref } from "vue";
import { getUnityMcpStatus } from "@/api/client";

/**
 * Load Unity MCP availability for optional Apply-via-MCP panel actions.
 *
 * @returns Reactive MCP status plus an Apply-via-MCP checkbox ref.
 *
 * @example
 * ```typescript
 * const { available, editorAvailable, warning, applyViaMcp } = useUnityMcpStatus();
 * ```
 */
export function useUnityMcpStatus() {
  const available = ref(false);
  const editorAvailable = ref(false);
  const warning = ref<string | null>(null);
  const applyViaMcp = ref(false);

  /**
   * Refresh MCP status from GET /api/unity-mcp/status.
   *
   * @returns Promise that resolves when status has been updated.
   */
  async function refresh(): Promise<void> {
    try {
      const response = await getUnityMcpStatus();
      const data = (response.data || {}) as Record<string, unknown>;
      available.value = Boolean(data.available);
      editorAvailable.value = Boolean(data.editor_available);
      warning.value =
        typeof data.editor_gated_warning === "string" ? data.editor_gated_warning : null;
    } catch {
      available.value = false;
      editorAvailable.value = false;
      warning.value = "Unity MCP server is not reachable.";
    }
  }

  onMounted(() => {
    void refresh();
  });

  return {
    available,
    editorAvailable,
    warning,
    applyViaMcp,
    refresh,
  };
}
